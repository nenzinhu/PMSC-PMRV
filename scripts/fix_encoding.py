import csv
import json
import base64
import os

csv_path = os.path.join('scripts', 'infracoes_original.csv')
output_js = os.path.join('src', 'js', 'infracoes-data.js')

def fix_and_convert():
    if not os.path.exists(csv_path):
        return

    records = []
    # Tentativas de encoding comuns em arquivos exportados do Excel no Brasil
    encodings = ['utf-16', 'utf-8-sig', 'latin-1', 'cp1252']
    
    content = None
    for enc in encodings:
        try:
            with open(csv_path, mode='r', encoding=enc) as f:
                content = f.read()
                if len(content) > 100:
                    print(f"Sucesso na leitura com encoding: {enc}")
                    break
        except Exception:
            continue

    if not content:
        print("Erro: Não foi possível ler o arquivo com nenhum encoding conhecido.")
        return

    # Processa as linhas manualmente para evitar problemas de delimitador do Excel
    lines = content.strip().split('\n')
    header_line = lines[0].replace('"', '').split(',')
    print(f"Colunas detectadas: {header_line}")

    for line in lines[1:]:
        # Divide por vírgula mas respeitando as aspas do Excel
        import shlex
        try:
            # O shlex é bom para arquivos que usam aspas, mas o CSV do Excel às vezes é chato
            # Vamos usar uma divisão simples e limpar as aspas
            parts = [p.strip().strip('"') for p in line.split(',')]
            if len(parts) < 2: continue

            records.append({
                "codigo": parts[0],
                "descricao": parts[1] if len(parts) > 1 else "",
                "artigo": parts[2] if len(parts) > 2 else "",
                "infrator": parts[3] if len(parts) > 3 else "",
                "valor": parts[4] if len(parts) > 4 else "0,00",
                "categoria": parts[5] if len(parts) > 5 else "",
                "medida": parts[6] if len(parts) > 6 else ""
            })
        except:
            continue

    # Salva o arquivo JS em UTF-8 Real
    json_data = json.dumps(records, ensure_ascii=False)
    js_content = f"export const INFRACOES_RAW = {json_data};\n"
    
    with open(output_js, 'w', encoding='utf-8') as f:
        f.write(js_content)
            
    print(f"Sucesso: {len(records)} infrações corrigidas e salvas.")

if __name__ == "__main__":
    fix_and_convert()
