from typing import BinaryIO
import asyncio

async def list(root: str = 'gcodes'):
    return {'result': [
    {
        "path": "3DBenchy_0.15mm_PLA_MK3S_2h6m.gcode",
        "modified": 1615077020.2025201,
        "size": 4926481,
        "permissions": "rw"
    },
    {
        "path": "Shape-Box_0.2mm_PLA_Ender2_20m.gcode",
        "modified": 1614910966.946807,
        "size": 324236,
        "permissions": "rw"
    },
    {
        "path": "test_dir/A-Wing.gcode",
        "modified": 1605202259,
        "size": 1687387,
        "permissions": "rw"
    },
    {
        "path": "test_dir/CE2_CubeTest.gcode",
        "modified": 1614644445.4025,
        "size": 1467339,
        "permissions": "rw"
    },
    {
        "path": "test_dir/V350_Engine_Block_-_2_-_Scaled.gcode",
        "modified": 1615768477.5133543,
        "size": 189713016,
        "permissions": "rw"
    }
]}

async def roots():
    return {'result': [
    {
        "name": "config",
        "path": "/home/pi/printer_data/config",
        "permissions": "rw"
    },
    {
        "name": "logs",
        "path": "/home/pi/printer_data/logs",
        "permissions": "r"
    },
    {
        "name": "gcodes",
        "path": "/home/pi/printer_data/gcodes",
        "permissions": "rw"
    },
    {
        "name": "config_examples",
        "path": "/home/pi/klipper/config",
        "permissions": "r"
    },
    {
        "name": "docs",
        "path": "/home/pi/klipper/docs",
        "permissions": "r"
    }
]}

async def metadata(filename: str):
    return {'result': {
    "size": 1629418,
    "modified": 1706359465.4947228,
    "uuid": "473a41d2-15f4-434b-aeb4-ab96eb122bbf",
    "file_processors": [],
    "slicer": "PrusaSlicer",
    "slicer_version": "2.7.1+win64",
    "gcode_start_byte": 87410,
    "gcode_end_byte": 1618468,
    "object_height": 8,
    "estimated_time": 5947,
    "nozzle_diameter": 0.4,
    "layer_height": 0.2,
    "first_layer_height": 0.2,
    "first_layer_extr_temp": 215,
    "first_layer_bed_temp": 60,
    "chamber_temp": 50,
    "filament_name": "Generic PLA Brown",
    "filament_type": "PLA",
    "filament_total": 9159.55,
    "filament_weight_total": 27.32,
    "thumbnails": [
        {
            "width": 32,
            "height": 32,
            "size": 1078,
            "relative_path": ".thumbs/hook_x4_0.2mm_PLA_MK3S_1h39m-32x32.png"
        },
        {
            "width": 400,
            "height": 300,
            "size": 61576,
            "relative_path": ".thumbs/hook_x4_0.2mm_PLA_MK3S_1h39m-400x300.png"
        }
    ],
    "print_start_time": 1706359466.722097,
    "job_id": "0000BF",
    "filename": filename
}}

async def metascan(filename: str):
    return {'result': {
    "size": 1629418,
    "modified": 1706359465.4947228,
    "uuid": "473a41d2-15f4-434b-aeb4-ab96eb122bbf",
    "file_processors": [],
    "slicer": "PrusaSlicer",
    "slicer_version": "2.7.1+win64",
    "gcode_start_byte": 87410,
    "gcode_end_byte": 1618468,
    "object_height": 8,
    "estimated_time": 5947,
    "nozzle_diameter": 0.4,
    "layer_height": 0.2,
    "first_layer_height": 0.2,
    "first_layer_extr_temp": 215,
    "first_layer_bed_temp": 60,
    "chamber_temp": 50,
    "filament_name": "Generic PLA Brown",
    "filament_type": "PLA",
    "filament_total": 9159.55,
    "filament_weight_total": 27.32,
    "thumbnails": [
        {
            "width": 32,
            "height": 32,
            "size": 1078,
            "relative_path": ".thumbs/hook_x4_0.2mm_PLA_MK3S_1h39m-32x32.png"
        },
        {
            "width": 400,
            "height": 300,
            "size": 61576,
            "relative_path": ".thumbs/hook_x4_0.2mm_PLA_MK3S_1h39m-400x300.png"
        }
    ],
    "print_start_time": 1706359466.722097,
    "job_id": "0000BF",
    "filename": "hook_x4_0.2mm_PLA_MK3S_1h39m.gcode"
}}

async def thumbnails(filename: str):
    return {'result': [
    {
        "width": 32,
        "height": 32,
        "size": 1551,
        "thumbnail_path": "test/.thumbs/CE2_FanCover-120mm-Mesh-32x32.png"
    },
    {
        "width": 300,
        "height": 300,
        "size": 31819,
        "thumbnail_path": "test/.thumbs/CE2_FanCover-120mm-Mesh.png"
    }
]}

async def get_directory(path: str = 'gcodes', extended: bool = False):
    return {'result': {
    "dirs": [
        {
            "modified": 1615768162.0412788,
            "size": 4096,
            "permissions": "rw",
            "dirname": "test"
        },
        {
            "modified": 1613569827.489749,
            "size": 4096,
            "permissions": "rw",
            "dirname": "Cura"
        },
        {
            "modified": 1615767459.6265886,
            "size": 4096,
            "permissions": "rw",
            "dirname": "thumbs"
        }
    ],
    "files": [
        {
            "modified": 1615578004.9639666,
            "size": 7300692,
            "permissions": "rw",
            "filename": "Funnel_0.2mm_PLA_Ender2_2h4m.gcode"
        },
        {
            "modified": 1589156863.9726968,
            "size": 4214831,
            "permissions": "rw",
            "filename": "CE2_Pi3_A+_CaseLID.gcode"
        },
        {
            "modified": 1615030592.7722695,
            "size": 2388774,
            "permissions": "rw",
            "filename": "CE2_calicat.gcode"
        }
    ],
    "disk_usage": {
        "total": 7522213888,
        "used": 4280369152,
        "free": 2903625728
    },
    "root_info": {
        "name": "gcodes",
        "permissions": "rw"
    }
}}

async def post_directory(path: str):
    return {'result': {
    "item": {
        "path": path[path.find('/')+1:],
        "root": path[:path.find('/')],
        "modified": 1676983427.3732708,
        "size": 4096,
        "permissions": "rw"
    },
    "action": "create_dir"
}}

async def delete_directory(path: str, force: bool = False):
    return {'result': {
    "item": {
        "path": path[path.find('/')+1:],
        "root": path[:path.find('/')],
        "modified": 0,
        "size": 0,
        "permissions": ""
    },
    "action": "delete_dir"
}}

async def move(source: str, dest: str):
    return {'result': {
    "item": {
        "root": dest[:dest.find('/')],
        "path": dest[dest.find('/')+1:],
        "modified": 1676940082.8595376,
        "size": 384096,
        "permissions": "rw"
    },
    "source_item": {
        "path": source[source.find('/')+1:],
        "root": source[:source.find('/')]
    },
    "action": "move_file"
}}

async def copy(source: str, dest: str):
    return {'result': {
    "item": {
        "root": dest[:dest.find('/')],
        "path": dest[dest.find('/')+1:],
        "modified": 1676940082.8595376,
        "size": 384096,
        "permissions": "rw"
    },
    "action": "create_file"
}}

async def upload(upload_path: str,
                 filename: str,
                 file: BinaryIO | bytes,
                 root: str = 'gcodes',
                 print: bool = False):
    raise Exception("Not implemented function")

async def download(filepath: str, root: str = 'gcodes'):
    return {
        'TEXT': "abcdefgabcdefg",
        'RESPONSE': None
    }

async def delete(filepath: str, root: str = 'gcodes'):
    return {'result': {
    "item": {
        "root": root,
        "path": filepath,
        "modified": 0,
        "size": 0,
        "permissions": ""
    },
    "action": "delete_file"
}}

# ------ TEST CODE ------

async def TEST():
    # Пример получения статуса
    flist = await roots()
    print('Files List:', flist)

    # Upload file
    with open('TEST.gcode', 'rb') as file:
        response = await upload(
            upload_path='',
            filename='TEST1.gcode',
            file=file
        )
        print('\nUpload file:', {'TEXT': response.text, 'RESPONSE': response})

    # Download file
    result = await download('TEST1.gcode')
    print('\nDownload result:', result)

    # Deleting test file
    result = await delete('TEST1.gcode')
    print('\nDelete result:', result)


if __name__ == '__main__':
    asyncio.run(TEST())