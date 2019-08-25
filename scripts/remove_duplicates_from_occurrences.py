"""
Made by Diego Daniel

Pass in the name of an exported file from the SSP site (converted to csv or
saved again by excel), and another file with suffix "_unique.csv" will be generated, 
containing all unique entries from the original file.

Usage:
	this_script.py <name_of_original_file>
"""
import csv, sys
if sys.argv[1].split('.')[-1] == "xls":
	import pandas
	reader = pandas.read_excel(sys.argv[1])
else: # is .csv
	rf = open(sys.argv[1], 'r', encoding='utf-8')
	reader = csv.reader(rf, delimiter='\t')

wf = open(sys.argv[1] + "_unique.csv", 'w', encoding='utf-8', newline="")
writer = csv.writer(wf, delimiter='\t')

added = set()
for row in reader:
	tup = tuple([row[0], row[1], row[22]])
	if tup not in added:
		writer.writerow(row)
		added.add(tup)

wf.close()

if (sys.argv[1].split('.')[-1] == "csv")
	rf.close()
