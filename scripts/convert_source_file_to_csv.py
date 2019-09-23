"""
Made by Diego Daniel

Pass in the name of a folder containing files downloaded from the SSP site,
and the name of a csv file that will be generated containing the data,
converted to the database format, from all the files merged into one.

Usage:
	this_script.py <name_of_folder> <name_of_new_csv_file>
"""
import csv, sys, geocoder
from os import listdir, remove
from os.path import isfile, join, splitext

def process_file(reader, writer):
    count_rows_without_coordinates_location_found = 0
    count_rows_without_coordinates_location_not_found = 0
    count_rows_without_coordinates_error_when_geocoding = 0
    count_rows_without_coordinates_and_address = 0
    count_rows_without_period = 0
    count_rows_without_year = 0
    count_rows_without_bo_number = 0
    count_rows_without_police_station_name = 0

    for row in reader:
        row_is_incomplete = False

        # row[6] -> PERIODOOCORRENCIA
        if (row[6] == ""):
            count_rows_without_period += 1
            row_is_incomplete = True

        # row[0] -> ANO_BO
        # row[1] -> NUM_BO
        # row[22] -> DELEGACIA_NOME
        if (row[0] == ""):
            count_rows_without_year += 1
            row_is_incomplete = True
        if (row[1] == ""):
            count_rows_without_bo_number += 1
            row_is_incomplete = True
        if (row[22] == ""):
            count_rows_without_police_station_name += 1
            row_is_incomplete = True

        if (row_is_incomplete):
            continue

        # row[17] -> LATITUDE
        # row[18] -> LONGITUDE
        if (row[17] == "" or row[18] == ""):
            if (row[12] != "" and row[13] != "" and row[15] != ""):
                try:
                    location = geocoder.google(row[12] + ", " + row[13] + " - " + ((row[14] + ", ") if row[14] != "" else "") + row[15] + " - SP", key="AIzaSyDn0gFwQ9wWVjFofAuxZVKh8-Pfqg_Y5yM")

                    if (location.ok):
                        row[17] = location.latlng[0]
                        row[18] = location.latlng[1]
                        count_rows_without_coordinates_location_found += 1
                    else:
                        count_rows_without_coordinates_location_not_found += 1
                        row_is_incomplete = True
                except requests.exceptions.RequestException as re:
                    count_rows_without_coordinates_error_when_geocoding += 1
            else:
                count_rows_without_coordinates_and_address += 1
                row_is_incomplete = True

        if (row_is_incomplete):
            continue
        
        writer.writerow([row[0], row[1], convert_date(row[3]), convert_date(row[4]), convert_date(row[5]), convert_period(row[6]), convert_yes_no(row[10]), row[17].replace(',', '.'), row[18].replace(',', '.'), row[19], row[22], row[23], row[25], convert_yes_no(row[30]), row[35][0], row[37], convert_skin_color(row[41]), row[42]])

    return count_rows_without_coordinates_location_found, count_rows_without_coordinates_location_not_found, count_rows_without_coordinates_error_when_geocoding, count_rows_without_coordinates_and_address, count_rows_without_period, count_rows_without_year, count_rows_without_bo_number, count_rows_without_police_station_name

def print_numbers_of_invalid_rows(count_rows_without_coordinates_location_found, count_rows_without_coordinates_location_not_found, count_rows_without_coordinates_error_when_geocoding, count_rows_without_coordinates_and_address, count_rows_without_period, count_rows_without_year, count_rows_without_bo_number, count_rows_without_police_station_name):
    if (count_rows_without_year > 0):
        print(str(count_rows_without_year) + " rows didn't have a year")

    if (count_rows_without_coordinates_and_address > 0):
        print(str(count_rows_without_coordinates_and_address) + " rows didn't have a coordinate or address")

    if (count_rows_without_coordinates_location_found > 0):
        print(str(count_rows_without_coordinates_location_found) + " rows didn't have a coordinate but location was found")

    if (count_rows_without_coordinates_location_not_found > 0):
        print(str(count_rows_without_coordinates_location_not_found) + " rows didn't have a coordinate but location was not found")

    if (count_rows_without_coordinates_error_when_geocoding > 0):
        print(str(count_rows_without_coordinates_error_when_geocoding) + " rows didn't have a coordinate but error occurred when geocoding")

    if (count_rows_without_period > 0):
        print(str(count_rows_without_period) + " rows didn't have a period")

    if (count_rows_without_bo_number > 0):
        print(str(count_rows_without_bo_number) + " rows didn't have a bo_number")

    if (count_rows_without_police_station_name > 0):
        print(str(count_rows_without_police_station_name) + " rows didn't have a police station name")

def convert_date(date):
    parts = date.split(" ")

    date_parts = parts[0].split("/")
    first_part_converted = date_parts[2] + '-' + date_parts[1] + '-' + date_parts[0]

    converted_date = first_part_converted
    if len(parts) > 1:
        converted_date += " " + parts[1]

    return converted_date

def convert_period(period):
    period = period.upper()
    if (period == "PELA MANHÃ"):
        return 'M'
    elif (period == "A TARDE"):
        return 'N'
    elif (period == "A NOITE"):
        return 'E'
    elif (period == "DE MADRUGADA"):
        return 'D'
    elif (period == "EM HORA INCERTA"):
        return 'U'

def convert_yes_no(yes_no):
    yes_no = yes_no.lower()
    if (yes_no == "sim"):
        return 'Y'
    else: # yes_no == "não"
        return 'N'

def convert_skin_color(skin_color):
    skin_color = skin_color.lower()

    if (skin_color == "branca" or skin_color == "branco"):
        return 'W'
    elif (skin_color == "preta" or skin_color == "negro" or skin_color == "negra" or skin_color == "preto"):
        return 'B'
    elif (skin_color == "parda" or skin_color == "pardo"):
        return 'P'
    elif (skin_color == "amarela" or skin_color == "amarelo"):
        return 'Y'
    elif (skin_color == "vermelha" or skin_color == "vermelho"):
        return 'R'

def convert_source_file(file_name):
    source_file = open(file_name, 'rb')
    file_data = source_file.read().replace(b'\x00', b'')
    source_file.close()

    file_without_null_bytes = open(file_name + ".clean", 'wb')
    file_without_null_bytes.write(file_data)
    file_without_null_bytes.close()

    source_file = open(file_name + '.clean', 'r', encoding='ansi')
    converted_file = open(splitext(file_name)[0]+ ".csv", 'w', encoding='utf-8', newline="")
    writer = csv.writer(converted_file, delimiter='\t')
    #fieldnames = ("ANO_BO","NUM_BO","NUMERO_BOLETIM","BO_INICIADO","BO_EMITIDO","DATAOCORRENCIA","PERIDOOCORRENCIA","DATACOMUNICACAO","DATAELABORACAO","BO_AUTORIA","FLAGRANTE","NUMERO_BOLETIM_PRINCIPAL","LOGRADOURO","NUMERO","BAIRRO","CIDADE","UF","LATITUDE","LONGITUDE","DESCRICAOLOCAL","EXAME","SOLUCAO","DELEGACIA_NOME","DELEGACIA_CIRCUNSCRICAO","ESPECIE","RUBRICA","DESDOBRAMENTO","STATUS","NOMEPESSOA","TIPOPESSOA","VITIMAFATAL","RG","RG_UF","NATURALIDADE","NACIONALIDADE","SEXO","DATANASCIMENTO","IDADE","ESTADOCIVIL","PROFISSAO","GRAUINSTRUCAO","CORCUTIS","NATUREZAVINCULADA","TIPOVINCULO","RELACIONAMENTO","PARENTESCO","PLACA_VEICULO","UF_VEICULO","CIDADE_VEICULO","DESCR_COR_VEICULO","DESCR_MARCA_VEICULO","ANO_FABRICACAO","ANO_MODELO","DESCR_TIPO_VEICULO","QUANT_CELULAR","MARCA_CELULAR")
    reader = csv.reader(source_file, delimiter='\t')
    #reader = csv.DictReader(original_csv_file, fieldnames, delimiter='\t')
    next(reader)

    # TODO check if it's right
    #writer.writerow([first_row[0], first_row[1], first_row[3], first_row[4], first_row[5], first_row[6], first_row[10], first_row[12], first_row[13], first_row[14], first_row[15], first_row[16], first_row[17], first_row[18], first_row[19], first_row[22], first_row[23], first_row[25], first_row[30], first_row[35], first_row[37], first_row[41], first_row[42]])
    writer.writerow(["ANO_BO", "NUM_BO", "BO_INICIADO", "BO_EMITIDO", "DATAOCORRENCIA",	"PERIDOOCORRENCIA",	"FLAGRANTE", "LATITUDE", "LONGITUDE", "DESCRICAOLOCAL", "DELEGACIA_NOME", "DELEGACIA_CIRCUNSCRICAO", "RUBRICA", "VITIMAFATAL", "SEXO", "IDADE", "CORCUTIS", "NATUREZAVINCULADA"])

    count_rows_without_coordinates_location_found, count_rows_without_coordinates_location_not_found, count_rows_without_coordinates_error_when_geocoding, count_rows_without_coordinates_and_address, count_rows_without_period, count_rows_without_year, count_rows_without_bo_number, count_rows_without_police_station_name = process_file(reader, writer)
    
    converted_file.close()
    source_file.close()

    print_numbers_of_invalid_rows(count_rows_without_coordinates_location_found, count_rows_without_coordinates_location_not_found, count_rows_without_coordinates_error_when_geocoding, count_rows_without_coordinates_and_address, count_rows_without_period, count_rows_without_year, count_rows_without_bo_number, count_rows_without_police_station_name)

def convert_source_files_in_folder(path_to_folder_with_files, merged_and_converted_file_full_name):

    merged_and_converted_file = open(merged_and_converted_file_full_name, 'w', encoding='utf-8', newline="")
    writer = csv.writer(merged_and_converted_file, delimiter='\t')
    writer.writerow(["ANO_BO", "NUM_BO", "BO_INICIADO", "BO_EMITIDO", "DATAOCORRENCIA",	"PERIDOOCORRENCIA",	"FLAGRANTE", "LATITUDE", "LONGITUDE", "DESCRICAOLOCAL", "DELEGACIA_NOME", "DELEGACIA_CIRCUNSCRICAO", "RUBRICA", "VITIMAFATAL", "SEXO", "IDADE", "CORCUTIS", "NATUREZAVINCULADA"])

    files_to_be_merged_and_converted = [join(path_to_folder_with_files, f) for f in listdir(path_to_folder_with_files) if isfile(join(path_to_folder_with_files, f)) and f.split('.')[-1] == 'xls']

    total_count_rows_without_coordinates_location_found = 0
    total_count_rows_without_coordinates_location_not_found = 0
    total_count_rows_without_coordinates_error_when_geocoding = 0
    total_count_rows_without_coordinates_and_address = 0
    total_count_rows_without_period = 0
    total_count_rows_without_year = 0
    total_count_rows_without_bo_number = 0
    total_count_rows_without_police_station_name = 0

    for file_name in files_to_be_merged_and_converted:
        source_file = open(file_name, 'rb')
        file_data = source_file.read().replace(b'\x00', b'')
        source_file.close()

        file_without_null_bytes = open(file_name + ".clean", 'wb')
        file_without_null_bytes.write(file_data)
        file_without_null_bytes.close()

        source_file = open(file_name + '.clean', 'r', encoding='ansi')
        
        #fieldnames = ("ANO_BO","NUM_BO","NUMERO_BOLETIM","BO_INICIADO","BO_EMITIDO","DATAOCORRENCIA","PERIDOOCORRENCIA","DATACOMUNICACAO","DATAELABORACAO","BO_AUTORIA","FLAGRANTE","NUMERO_BOLETIM_PRINCIPAL","LOGRADOURO","NUMERO","BAIRRO","CIDADE","UF","LATITUDE","LONGITUDE","DESCRICAOLOCAL","EXAME","SOLUCAO","DELEGACIA_NOME","DELEGACIA_CIRCUNSCRICAO","ESPECIE","RUBRICA","DESDOBRAMENTO","STATUS","NOMEPESSOA","TIPOPESSOA","VITIMAFATAL","RG","RG_UF","NATURALIDADE","NACIONALIDADE","SEXO","DATANASCIMENTO","IDADE","ESTADOCIVIL","PROFISSAO","GRAUINSTRUCAO","CORCUTIS","NATUREZAVINCULADA","TIPOVINCULO","RELACIONAMENTO","PARENTESCO","PLACA_VEICULO","UF_VEICULO","CIDADE_VEICULO","DESCR_COR_VEICULO","DESCR_MARCA_VEICULO","ANO_FABRICACAO","ANO_MODELO","DESCR_TIPO_VEICULO","QUANT_CELULAR","MARCA_CELULAR")
        reader = csv.reader(source_file, delimiter='\t')
        #reader = csv.DictReader(original_csv_file, fieldnames, delimiter='\t')
        next(reader)

        # TODO check if it's right
        #writer.writerow([first_row[0], first_row[1], first_row[3], first_row[4], first_row[5], first_row[6], first_row[10], first_row[12], first_row[13], first_row[14], first_row[15], first_row[16], first_row[17], first_row[18], first_row[19], first_row[22], first_row[23], first_row[25], first_row[30], first_row[35], first_row[37], first_row[41], first_row[42]])
        
        count_rows_without_coordinates_location_found, count_rows_without_coordinates_location_not_found, count_rows_without_coordinates_error_when_geocoding, count_rows_without_coordinates_and_address, count_rows_without_period, count_rows_without_year, count_rows_without_bo_number, count_rows_without_police_station_name = process_file(reader, writer)
    
        total_count_rows_without_coordinates_location_found += count_rows_without_coordinates_location_found
        total_count_rows_without_coordinates_location_not_found += count_rows_without_coordinates_location_not_found
        total_count_rows_without_coordinates_error_when_geocoding += count_rows_without_coordinates_error_when_geocoding
        total_count_rows_without_coordinates_and_address += count_rows_without_coordinates_and_address
        total_count_rows_without_period += count_rows_without_period
        total_count_rows_without_year += count_rows_without_year
        total_count_rows_without_bo_number += count_rows_without_bo_number
        total_count_rows_without_police_station_name += count_rows_without_police_station_name

        source_file.close()
        remove(file_name + '.clean') # Deletes the created file

    merged_and_converted_file.close()

    print_numbers_of_invalid_rows(total_count_rows_without_coordinates_location_found, total_count_rows_without_coordinates_location_not_found, total_count_rows_without_coordinates_error_when_geocoding, total_count_rows_without_coordinates_and_address, total_count_rows_without_period, total_count_rows_without_year, total_count_rows_without_bo_number, total_count_rows_without_police_station_name)

if __name__ == '__main__':
    #convert(sys.argv[1], sys.argv[2])
    #convert_source_file("F:/Programming/TCC/dados_ssp/source/DadosBO_2019_7(LESÃO CORPORAL DOLOSA SEGUIDA DE MORTE).xls".replace('/', '\\'))
    convert_source_files_in_folder(sys.argv[1], sys.argv[2])