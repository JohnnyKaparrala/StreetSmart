"""
Made by Diego Daniel
Edited by visual

Pass in the name of an csv file converted from a spreadsheet from the SSP site,
and a json file will be generated, containing the data from
the original file in a json list of objects, each object representing one row.

Usage:
	this_script.py <name_of_original_file> <delimiter_of_csv_file>
"""
import csv, sys
from os import listdir, remove
from os.path import isfile, join, splitext

def print_numbers_of_invalid_rows(count_rows_without_year, count_rows_without_coordinates, count_rows_without_period, count_rows_without_bo_number, count_rows_without_police_station_name):
    if (count_rows_without_year > 0):
        print(str(count_rows_without_year) + " rows didn't have a year")

    if (count_rows_without_coordinates > 0):
        print(str(count_rows_without_coordinates) + " rows didn't have a coordinate")

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
    writer.writerow(["ANO_BO", "NUM_BO", "BO_INICIADO", "BO_EMITIDO", "DATAOCORRENCIA",	"PERIDOOCORRENCIA",	"FLAGRANTE", "LOGRADOURO", "NUMERO", "BAIRRO", "CIDADE", "UF", "LATITUDE", "LONGITUDE", "DESCRICAOLOCAL", "DELEGACIA_NOME", "DELEGACIA_CIRCUNSCRICAO", "RUBRICA", "VITIMAFATAL", "SEXO", "IDADE", "CORCUTIS", "NATUREZAVINCULADA"])

    count_rows_without_coordinates = 0
    count_rows_without_period = 0
    count_rows_without_year = 0
    count_rows_without_bo_number = 0
    count_rows_without_police_station_name = 0
    for row in reader:
        row_is_incomplete = False
        # row[12] -> LATITUDE
        # row[13] -> LONGITUDE
        if (row[12] == "" or row[13] == ""):
            count_rows_without_coordinates += 1
            row_is_incomplete = True

        # row[5] -> PERIODOOCORRENCIA
        if (row[5] == ""):
            count_rows_without_period += 1
            row_is_incomplete = True

        # row[0] -> ANO_BO
        # row[1] -> NUM_BO
        # row[15] -> DELEGACIA_NOME
        if (row[0] == ""):
            count_rows_without_year += 1
            row_is_incomplete = True
        if (row[1] == ""):
            count_rows_without_bo_number += 1
            row_is_incomplete = True
        if (row[15] == ""):
            count_rows_without_police_station_name += 1
            row_is_incomplete = True

        if (row_is_incomplete):
            continue
        
        writer.writerow([row[0], row[1], convert_date(row[3]), convert_date(row[4]), convert_date(row[5]), convert_period(row[6]), convert_yes_no(row[10]), row[12], row[13], row[14], row[15], row[16], row[17].replace(',', '.'), row[18].replace(',', '.'), row[19], row[22], row[23], row[25], convert_yes_no(row[30]), row[35][0], row[37], convert_skin_color(row[41]), row[42]])
    
    converted_file.close()
    source_file.close()

    print_numbers_of_invalid_rows(count_rows_without_year, count_rows_without_coordinates, count_rows_without_period, count_rows_without_bo_number, count_rows_without_police_station_name)

def convert_source_files_in_folder(path_to_folder_with_files, merged_and_converted_file_full_name):

    merged_and_converted_file = open(merged_and_converted_file_full_name, 'w', encoding='utf-8', newline="")
    writer = csv.writer(merged_and_converted_file, delimiter='\t')
    writer.writerow(["ANO_BO", "NUM_BO", "BO_INICIADO", "BO_EMITIDO", "DATAOCORRENCIA",	"PERIDOOCORRENCIA",	"FLAGRANTE", "LOGRADOURO", "NUMERO", "BAIRRO", "CIDADE", "UF", "LATITUDE", "LONGITUDE", "DESCRICAOLOCAL", "DELEGACIA_NOME", "DELEGACIA_CIRCUNSCRICAO", "RUBRICA", "VITIMAFATAL", "SEXO", "IDADE", "CORCUTIS", "NATUREZAVINCULADA"])

    files_to_be_merged_and_converted = [join(path_to_folder_with_files, f) for f in listdir(path_to_folder_with_files) if isfile(join(path_to_folder_with_files, f)) and f.split('.')[-1] == 'xls']

    count_rows_without_coordinates = 0
    count_rows_without_period = 0
    count_rows_without_year = 0
    count_rows_without_bo_number = 0
    count_rows_without_police_station_name = 0

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
        
        for row in reader:
            row_is_incomplete = False
            # row[12] -> LATITUDE
            # row[13] -> LONGITUDE
            if (row[12] == "" or row[13] == ""):
                count_rows_without_coordinates += 1
                row_is_incomplete = True

            # row[5] -> PERIODOOCORRENCIA
            if (row[5] == ""):
                count_rows_without_period += 1
                row_is_incomplete = True

            # row[0] -> ANO_BO
            # row[1] -> NUM_BO
            # row[15] -> DELEGACIA_NOME
            if (row[0] == ""):
                count_rows_without_year += 1
                row_is_incomplete = True
            if (row[1] == ""):
                count_rows_without_bo_number += 1
                row_is_incomplete = True
            if (row[15] == ""):
                count_rows_without_police_station_name += 1
                row_is_incomplete = True

            if (row_is_incomplete):
                continue
            
            writer.writerow([row[0], row[1], convert_date(row[3]), convert_date(row[4]), convert_date(row[5]), convert_period(row[6]), convert_yes_no(row[10]), row[12], row[13], row[14], row[15], row[16], row[17].replace(',', '.'), row[18].replace(',', '.'), row[19], row[22], row[23], row[25], convert_yes_no(row[30]), (row[35][0] if len(row[35]) > 0 else ''), row[37], convert_skin_color(row[41]), row[42]])
    
        source_file.close()
        remove(file_name + '.clean') # Deletes the created file

    merged_and_converted_file.close()

    print_numbers_of_invalid_rows(count_rows_without_year, count_rows_without_coordinates, count_rows_without_period, count_rows_without_bo_number, count_rows_without_police_station_name)

if __name__ == '__main__':
    #convert(sys.argv[1], sys.argv[2])
    #convert_source_file("G:/Programming/TCC/dados_ssp/source/DadosBO_2019_7(LESÃO CORPORAL DOLOSA SEGUIDA DE MORTE).xls".replace('/', '\\'))
    convert_source_files_in_folder("G:\\Programming\\TCC\\dados_ssp\\source", "G:\\Programming\\TCC\\dados_ssp\\source\\merged.csv")