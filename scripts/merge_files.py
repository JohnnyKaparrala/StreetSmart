"""
Made by Diego Daniel

Pass in the name of a folder containing a list of files to be merged into one, and the name of the merged file to be generated.

Usage:
	this_script.py <name_of_text_file> <name_of_new_csv_file>
"""
import csv, sys
from os import listdir, remove
from os.path import isfile, join, splitext
from progress_bar import printProgressBar

def merge_files(path_to_folder_with_files, merged_file_full_name):

    merged_file = open(merged_file_full_name, 'w', encoding='utf-8', newline="")
    writer = csv.writer(merged_file, delimiter='\t')
    writer.writerow(["ANO_BO", "NUM_BO", "BO_INICIADO", "BO_EMITIDO", "DATAOCORRENCIA",	"PERIDOOCORRENCIA",	"FLAGRANTE", "LATITUDE", "LONGITUDE", "DESCRICAOLOCAL", "DELEGACIA_NOME", "DELEGACIA_CIRCUNSCRICAO", "RUBRICA", "VITIMAFATAL", "SEXO", "IDADE", "CORCUTIS", "NATUREZAVINCULADA"])
    

    files_to_be_merged = [join(path_to_folder_with_files, f) for f in listdir(path_to_folder_with_files) if isfile(join(path_to_folder_with_files, f)) and f.split('.')[-1] == 'csv']
    number_of_files_to_be_merged_str = str(len(files_to_be_merged))


    print("Begining to merge " + number_of_files_to_be_merged_str + " files")
    
    total_row_count = 0

    current_file_index = 1
    for file_name in files_to_be_merged:
        print("File " + str(current_file_index) + '/' + number_of_files_to_be_merged_str + ':')
        print(file_name)

        print("Counting rows...")
        source_file = open(file_name, 'r', encoding='ansi')
        
        reader = csv.reader(source_file, delimiter='\t')
        next(reader)

        row_count = sum(1 for row in reader)
        print(str(row_count) + " rows")
        total_row_count += row_count

        source_file.close()

        current_file_index += 1

    current_file_index = 1
    current_row_index = 0
    for file_name in files_to_be_merged:
        print("File " + str(current_file_index) + '/' + number_of_files_to_be_merged_str + ':')
        print(file_name)

        source_file = open(file_name, 'r', encoding='utf-8')
        
        reader = csv.reader(source_file, delimiter='\t')
        next(reader)
        
        for row in reader:
            writer.writerow(row)
            current_row_index += 1
            if (current_row_index % 100 == 0 or current_row_index == total_row_count):
                printProgressBar(current_row_index, total_row_count, suffix='Completed', decimals=2)

        print()
        source_file.close()
        current_file_index += 1

    merged_file.close()

if __name__ == '__main__':
    if (len(sys.argv) < 3):
        print("Read the comments on the beginning of the script")
        exit()

    merge_files(sys.argv[1], sys.argv[2])