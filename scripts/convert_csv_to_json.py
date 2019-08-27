"""
Made by Diego Daniel

Pass in the name of an csv file converted from a spreadsheet from the SSP site,
and another file with suffix ".json" will be generated, containing the data from
the original file in a json list of objects, each object representing one row.

Usage:
	this_script.py <name_of_original_file>
"""
import csv, sys, json
original_csv_file = open(sys.argv[1], 'r', encoding='utf-8')
fieldnames = ("ANO_BO","NUM_BO","NUMERO_BOLETIM","BO_INICIADO","BO_EMITIDO","DATAOCORRENCIA","PERIDOOCORRENCIA","DATACOMUNICACAO","DATAELABORACAO","BO_AUTORIA","FLAGRANTE","NUMERO_BOLETIM_PRINCIPAL","LOGRADOURO","NUMERO","BAIRRO","CIDADE","UF","LATITUDE","LONGITUDE","DESCRICAOLOCAL","EXAME","SOLUCAO","DELEGACIA_NOME","DELEGACIA_CIRCUNSCRICAO","ESPECIE","RUBRICA","DESDOBRAMENTO","STATUS","NOMEPESSOA","TIPOPESSOA","VITIMAFATAL","RG","RG_UF","NATURALIDADE","NACIONALIDADE","SEXO","DATANASCIMENTO","IDADE","ESTADOCIVIL","PROFISSAO","GRAUINSTRUCAO","CORCUTIS","NATUREZAVINCULADA","TIPOVINCULO","RELACIONAMENTO","PARENTESCO","PLACA_VEICULO","UF_VEICULO","CIDADE_VEICULO","DESCR_COR_VEICULO","DESCR_MARCA_VEICULO","ANO_FABRICACAO","ANO_MODELO","DESCR_TIPO_VEICULO","QUANT_CELULAR","MARCA_CELULAR")
reader = csv.DictReader(original_csv_file, fieldnames, delimiter='\t')

converted_json_file = open(sys.argv[1] + ".json", 'w', encoding='utf-8')
original_csv_file_data = json.dumps([row for row in reader])
converted_json_file.write(original_csv_file_data)

original_csv_file.close()
converted_json_file.close()