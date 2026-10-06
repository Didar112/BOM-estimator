import zipfile
import xml.etree.ElementTree as ET
import sys

sys.stdout.reconfigure(encoding='utf-8')

z = zipfile.ZipFile('CALCULATION FORMULA(1).xlsx')
sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
strings = [''.join(node.text for node in si.iter() if node.text) for si in sst.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si')]

def inspect_sheet(sheet_file, sheet_name):
    print(f"\n================ Sheet: {sheet_name} ================")
    sheet_xml = ET.fromstring(z.read(sheet_file))
    for row in sheet_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_num = int(row.attrib.get('r'))
        cells = []
        for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            f = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}f')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            t = c.attrib.get('t')
            val = v.text if v is not None else ''
            text_val = strings[int(val)] if t == 's' and val.isdigit() and int(val) < len(strings) else val
            f_val = f.text if f is not None else ''
            ref = c.attrib.get('r')
            if text_val or f_val:
                cells.append(f"{ref}: {text_val}" + (f" [={f_val}]" if f_val else ""))
        if cells:
            print(f"Row {row_num}: " + " | ".join(cells))

inspect_sheet('xl/worksheets/sheet2.xml', 'CZ#5')
inspect_sheet('xl/worksheets/sheet5.xml', 'MZ#3')
