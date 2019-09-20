"""
Made by Emmanuel Casangel


"""
import csv, sys, os
import pandas
	
reader = pandas.read_excel(sys.argv[1])

wf = open(os.path.splitext(path)[0]+ ".csv", 'w', encoding='ansi', newline="")
writer = csv.writer(wf, delimiter='\t')

added = set()
for row in reader:
	tup = tuple([row[0], row[1], row[22]])
	if tup not in added:
		
		row[3] = replace_data(row[3]) 
		row[4] = replace_data(row[4]) 
		row[5] = replace_data(row[5]) 
		
		##PERIODOOCORRENCIA
		if row[6] == "PELA MANHÃ":
			row[6] = "M"
		elif row[6] == "DE MADRUGADA":
			row[6] = "D"
		elif row[6] == "A TARDE":
			row[6] = "N"
		elif row[6] == "A NOITE":
			row[6] = "E"
		else ##row[6] == "EM HORA INCERTA":
			row[6] = "U"

		##BO_AUTORIA
		if row[9] == "Conhecida":
			row[9] = "K"
		else ##row[9] == "Desconhecida";
			row[9] = "U"

		##FLAGRANTE
		if row[10] == "Sim":
			row[10] = "Y"
		else ##row[10] == "Nao";
			row[10] = "N"

		##VITIMAFATAL
		if row[31] == "Sim":
			row[31] = "Y"
		else ##row[31] == "Nao";
			row[31] = "N"

		##LATITUDE e LONGITUDE
		row[17] = row[17].replace(",", ".")
		row[18] = row[18].replace(",", ".") 

		##SEXO
		row[35] = (row[35])[0] 

		##CORCUTIS
		if row[41] == "Branca":
			row[41] = "W"
		elif row[41] == "Preta":
			row[41] = "B"
		elif row[41] == "Parda":
			row[41] = "P"
		elif row[41] == "Vermelha":
			row[41] = "R"
		else ##row[41] == "Amarela":
			row[41] = "Y"
		
    			
		writer.writerow(row)
		added.add(tup)

wf.close()

def replace_data(d):
	data_inteira = d.split(" ")
	data = data_inteira[0].split("/")
	return data[2] + data[1] + data[0] + data_inteira[1] 
