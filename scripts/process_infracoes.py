import csv
import json
import base64
import os

csv_path = os.path.join('scripts', 'infracoes_original.csv')
output_js = os.path.join('src', 'js', 'infracoes-data.js')

def convert_infracoes():
    if not os.path.exists(csv_path):
        return

    records = []
    try:
        # Abre o CSV com encoding latin-1
        with open(csv_path, mode='r', encoding='latin-1') as f:
            # Lê a primeira linha para identificar as colunas reais
            header = f.readline().replace('"', '').strip().split(',')
            print(f"Header detectado: {header}")
            
            # Reposiciona e lê o resto
            f.seek(0)
            reader = csv.reader(f)
            next(reader) # Pula o header
            
            for row in reader:
                if len(row) < 2: continue
                
                records.append({
                    "codigo": row[0].strip(),
                    "descricao": row[1].strip(),
                    "artigo": row[2].strip() if len(row) > 2 else "",
                    "infrator": row[3].strip() if len(row) > 3 else "",
                    "valor": row[4].strip() if len(row) > 4 else "0,00",
                    "categoria": row[5].strip() if len(row) > 5 else "",
                    "medida": row[6].strip() if len(row) > 6 else ""
                })

        # Salva o arquivo JS
        json_data = json.dumps(records, ensure_ascii=False)
        b64_data = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')
        
        content = f"export const INFRACOES_RAW = {json_data};\n"
        content += f"export const INFRACOES_CSV_BASE64 = \"{b64_data}\";"
        
        with open(output_js, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Sucesso: {len(records)} infrações processadas.")
        
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    convert_infracoes()
