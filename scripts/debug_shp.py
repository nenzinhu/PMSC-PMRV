import shapefile
import os
import json

# Caminho relativo baseado na estrutura do projeto
shp_path = os.path.join('Rodovias_SC_04.24', 'Rodovias_SC.shp')

def inspect_and_extract():
    if not os.path.exists(shp_path):
        print(f"Erro: Arquivo não encontrado em {shp_path}")
        return

    try:
        with shapefile.Reader(shp_path) as sf:
            fields = [field[0] for field in sf.fields[1:]]
            print(f"Campos: {fields}")
            
            # Rodovias de interesse na Grande Florianópolis
            target_roads = ['SC-401', 'SC-403', 'SC-405', 'SC-406', 'SC-407', 'SC-281']
            extracted_data = {}

            for i, record in enumerate(sf.records()):
                # Tenta encontrar o nome da rodovia nos campos (geralmente 'IDENTIFICA' ou similar)
                # Como não sabemos o nome exato do campo, vamos imprimir o primeiro registro para mapear
                if i == 0:
                    print(f"Exemplo de Registro: {dict(zip(fields, record))}")
                
                # Mapeamento provável (ajustar conforme o print acima)
                road_id = str(record[0]) # Geralmente o primeiro campo é a identificação
                
                if any(target in road_id for target in target_roads):
                    shape = sf.shape(i)
                    # Pega o ponto central ou inicial do segmento para referência
                    points = shape.points
                    if points:
                        lat, lng = points[0][1], points[0][0] # Shapefile é Long, Lat
                        
                        if road_id not in extracted_data:
                            extracted_data[road_id] = []
                        
                        extracted_data[road_id].append({
                            "lat": lat,
                            "lng": lng,
                            "record": dict(zip(fields, record))
                        })

            print(f"Extraídos {len(extracted_data)} segmentos de rodovias alvo.")
            
    except Exception as e:
        print(f"Erro ao processar: {e}")

if __name__ == "__main__":
    inspect_and_extract()
