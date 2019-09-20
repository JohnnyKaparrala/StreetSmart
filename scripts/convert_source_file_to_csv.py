"""
Made by Diego Daniel
Edited by visual

Pass in the name of an csv file converted from a spreadsheet from the SSP site,
and a json file will be generated, containing the data from
the original file in a json list of objects, each object representing one row.

Usage:
	this_script.py <name_of_original_file> <delimiter_of_csv_file>
"""
import csv, sys, os

def convert_source_file(path):
    def convert_date(date):
        parts = date.split(" ")

        date_parts = parts[0].split("/")
        first_part_converted = date_parts[2] + '-' + date_parts[1] + '-' + date_parts[0]

        converted_date = first_part_converted
        if len(parts) > 1:
            converted_date += " " + parts[1]

        return converted_date

    def convert_period(period):
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
        if (yes_no == "Sim"):
            return 'Y'
        else # yes_no == "Não"
            return 'N'

    source_file = open(path, 'rb')
    file_data = source_file.read().replace(b'\x00', b'')
    source_file.close()

    file_without_null_bytes = open(path + ".clean", 'wb')
    file_without_null_bytes.write(file_data)
    file_without_null_bytes.close()

    source_file = open(path + '.clean', 'r', encoding='ansi')
    converted_file = open(os.path.splitext(path)[0]+ ".csv", 'w', encoding='ansi', newline="")
    writer = csv.writer(converted_file, delimiter='\t')
    #fieldnames = ("ANO_BO","NUM_BO","NUMERO_BOLETIM","BO_INICIADO","BO_EMITIDO","DATAOCORRENCIA","PERIDOOCORRENCIA","DATACOMUNICACAO","DATAELABORACAO","BO_AUTORIA","FLAGRANTE","NUMERO_BOLETIM_PRINCIPAL","LOGRADOURO","NUMERO","BAIRRO","CIDADE","UF","LATITUDE","LONGITUDE","DESCRICAOLOCAL","EXAME","SOLUCAO","DELEGACIA_NOME","DELEGACIA_CIRCUNSCRICAO","ESPECIE","RUBRICA","DESDOBRAMENTO","STATUS","NOMEPESSOA","TIPOPESSOA","VITIMAFATAL","RG","RG_UF","NATURALIDADE","NACIONALIDADE","SEXO","DATANASCIMENTO","IDADE","ESTADOCIVIL","PROFISSAO","GRAUINSTRUCAO","CORCUTIS","NATUREZAVINCULADA","TIPOVINCULO","RELACIONAMENTO","PARENTESCO","PLACA_VEICULO","UF_VEICULO","CIDADE_VEICULO","DESCR_COR_VEICULO","DESCR_MARCA_VEICULO","ANO_FABRICACAO","ANO_MODELO","DESCR_TIPO_VEICULO","QUANT_CELULAR","MARCA_CELULAR")
    reader = csv.reader(source_file, delimiter='\t')
    #reader = csv.DictReader(original_csv_file, fieldnames, delimiter='\t')
    first_row = next(reader)

    # TODO check if it's right
    writer.writerow([first_row[0], first_row[1], first_row[3], first_row[4], first_row[5], first_row[6], first_row[10], first_row[12], first_row[13], first_row[14], first_row[15], first_row[16], first_row[17], first_row[18], first_row[19], first_row[22], first_row[23], first_row[25], first_row[30], first_row[35], first_row[37], first_row[41], first_row[42]])

    for row in reader:
        writer.writerow([row[0], row[1], convert_date(row[3]), convert_date(row[4]), convert_date(row[5]), convert_period(row[6]), convert_yes_no(row[10]), row[12], row[13], row[14], row[15], row[16], row[17].replace(',', '.'), row[18].replace(',', '.'), row[19], row[22], row[23], row[25], convert_yes_no(row[30]), row[35][0], row[37], convert_skin_color(row[41]), row[42]])
    
    converted_file.close()
    source_file.close()

if __name__ == '__main__':
    #convert(sys.argv[1], sys.argv[2])
    convert_source_file("F:/Programming/TCC/dados_ssp/source/DadosBO_2019_7(LESÃO CORPORAL DOLOSA SEGUIDA DE MORTE).xls".replace('/', '\\'))