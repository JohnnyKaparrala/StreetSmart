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
		
		
		writer.writerow(row)
		added.add(tup)

wf.close()

