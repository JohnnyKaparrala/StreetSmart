"""
Usage:
	this_script.py <folder_path> <delimiter_of_csv_files_inside_folder>
"""

import glob, os, sys, convert_csv_to_json
os.chdir(sys.argv[1])
for file in glob.glob("*.csv"):
    #print("py par \"" + sys.argv[1] + "\\"+ file + "\" "  + sys.argv[2])
    #os.system("python remove_duplicates_from_occurrences.py " + sys.argv[1] + file + " -"  + sys.argv[2])
    convert_csv_to_json.convert( sys.argv[1] + "\\"+ file , sys.argv[2])
