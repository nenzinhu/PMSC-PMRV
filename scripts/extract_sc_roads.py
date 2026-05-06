import shapefile
import os
import json
from pyproj import Transformer

# Configuração de Projeção: UTM Zona 22S (SIRGAS 2000) para WGS84 (Lat/Lng)
# EPSG:31982 (SIRGAS 2000 / UTM zone 22S) -> EPSG:4326 (WGS 84)
transformer = Transformer.from_crs("epsg:31982", "epsg:4326", always_xy=True)

def utm_to_wgs84(x, y):
    """Converte UTM (X, Y) para (Longitude, Latitude)"""
    lng, lat = transformer.transform(x, y)
    return lat, lng

shp_path = os.path.join('Rodovias_SC_04.24', 'Rodovias_SC.shp')
output_js = os.path.join('src', 'js', 'rodovias_sc_data.js')

def extract_comprehensive_data():
    if not os.path.exists(shp_path):
        print(f"Erro: Arquivo {shp_path} não encontrado.")
        return

    try:
        with shapefile.Reader(shp_path) as sf:
            fields = [field[0] for field in sf.fields[1:]]
            
            # Rodovias Alvo - Grande Florianópolis
            target_roads = ['SC-401', 'SC-403', 'SC-405', 'SC-406', 'SC-407', 'SC-281']
            road_data = {}

            print(f"Lendo {len(sf.records())} registros do Shapefile...")
            for i, record in enumerate(sf.records()):
                rec_dict = dict(zip(fields, record))
                rod = str(rec_dict.get('RODOVIA', ''))
                
                # Filtra rodovias alvo
                matched_target = next((t for t in target_roads if t in rod), None)
                
                if matched_target:
                    shape = sf.shape(i)
                    points = shape.points
                    if not points: continue
                    
                    km_start = float(rec_dict.get('KM INICIAL', 0))
                    km_end = float(rec_dict.get('KM FINAL', 0))
                    
                    # Converte pontos inicial e final de UTM para WGS84
                    lat1, lng1 = utm_to_wgs84(points[0][0], points[0][1])
                    lat2, lng2 = utm_to_wgs84(points[-1][0], points[-1][1])
                    
                    p1 = {"lat": lat1, "lng": lng1, "km": km_start, "desc": str(rec_dict.get('INICIO TRE', ''))}
                    p2 = {"lat": lat2, "lng": lng2, "km": km_end, "desc": str(rec_dict.get('FINAL TREC', ''))}
                    
                    if matched_target not in road_data:
                        road_data[matched_target] = {"nome": rod, "refs": []}
                    
                    road_data[matched_target]["refs"].append(p1)
                    road_data[matched_target]["refs"].append(p2)

            # Salva o arquivo JS
            content = f"export const RODOVIAS_SC_FULL = {json.dumps(road_data, indent=2)};"
            with open(output_js, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Sucesso: {len(road_data)} rodovias exportadas com coordenadas WGS84 para {output_js}")
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    extract_comprehensive_data()
