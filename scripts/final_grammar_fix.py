import json
import os

output_js = os.path.join('src', 'js', 'infracoes-data.js')

def final_grammar_fix():
    if not os.path.exists(output_js):
        return

    try:
        # Mapa de correções gramaticais e de codificação
        correcoes = {
            '¾': 'o', 'þ': 'ç', 'Ò': 'ã', 'Ó': 'à', 'Ý': 'í', 'ß': 'á', 
            'º': '§', '║': 'º', 'àpessoa': 'à pessoa', 'nÒo': 'não',
            'veÝculo': 'veículo', 'identificaþÒo': 'identificação',
            'infraþÒo': 'infração', 'descriþÒo': 'descrição',
            'jurÝdica': 'jurídica', 'possue': 'possui', 'permissÒo': 'permissão',
            'estß': 'está', 'veic.': 'veículo', 'c/': 'com', 'p/': 'para'
        }

        # Lê o arquivo como texto bruto para limpar o lixo
        with open(output_js, 'r', encoding='utf-8') as f:
            content = f.read()

        # Isola a parte do JSON
        start_marker = 'export const INFRACOES_RAW = ['
        end_marker = '];'
        
        start_index = content.find(start_marker) + len(start_marker) - 1
        end_index = content.rfind(end_marker) + 1
        
        json_str = content[start_index:end_index]
        records = json.loads(json_str)

        fixed_records = []
        for r in records:
            new_r = {}
            for key, val in r.items():
                new_val = str(val)
                for erro, correto in correcoes.items():
                    new_val = new_val.replace(erro, correto)
                new_r[key] = new_val
            fixed_records.append(new_r)

        # Salva o arquivo JS limpo
        js_content = f"export const INFRACOES_RAW = {json.dumps(fixed_records, ensure_ascii=False)};\n"
        js_content += "export const INFRACOES_CSV_BASE64 = \"\";\n"
        
        with open(output_js, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("Sucesso: Gramática e codificação corrigidas.")

    except Exception as e:
        print(f"Erro na correção: {e}")

if __name__ == "__main__":
    final_grammar_fix()
