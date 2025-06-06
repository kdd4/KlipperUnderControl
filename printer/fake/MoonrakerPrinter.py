import random
import asyncio

async def info():
    return {'result': {
        "state": "ready",
        "state_message": "Printer is ready",
        "hostname": "pi-debugger",
        "klipper_path": "/home/pi/klipper",
        "python_path": "/home/pi/klipper/venv/bin/python",
        "process_id": 275124,
        "user_id": 1000,
        "group_id": 1000,
        "log_file": "/home/pi/printer_data/logs/klippy.log",
        "config_file": "/home/pi/printer_data/config/printer.cfg",
        "software_version": "v0.12.0-85-gd785b396",
        "cpu_info": "4 core ?"
    }}

async def emergency_stop():
    return {'result': 'ok'}

async def restart():
    return {'result': 'ok'}

async def firmware_restart():
    return {'result': 'ok'}

async def objects_list():
    return {'result': {
        "objects": [
            "gcode",
            "webhooks",
            "configfile",
            "mcu",
            "mcu linux",
            "heaters",
            "bme280 chamber",
            "temperature_sensor chamber",
            "filament_switch_sensor extruder_sensor",
            "output_pin sensor_toggle",
            "gcode_move",
            "bed_mesh",
            "exclude_object",
            "temperature_host RPi",
            "temperature_sensor RPi",
            "gcode_macro TURN_OFF_MOTORS",
            "gcode_macro SET_HOMING_CURRENT",
            "temperature_sensor ambient",
            "gcode_macro query_bme280",
            "pause_resume",
            "print_stats",
            "virtual_sdcard",
            "probe",
            "stepper_enable",
            "tmc2130 stepper_x",
            "tmc2130 stepper_y",
            "tmc2130 stepper_z",
            "tmc2130 extruder",
            "heater_bed",
            "heater_fan nozzle_cooling_fan",
            "fan",
            "menu",
            "display_status",
            "output_pin BEEPER_pin",
            "idle_timeout",
            "motion_report",
            "query_endstops",
            "system_stats",
            "manual_probe",
            "toolhead",
            "extruder"
        ]
    }}

async def objects_query(objects_params: dict):
    return {'result': {
        "eventtime": 578243.57824499,
        "status": {
            'extruder': {
                'temperature': random.randint(235,245),
                'target': 240,
                'power': random.randint(90,100)
            },
            'heater_bed': {
                'temperature': random.randint(75,85),
                'target': 80,
                'power': random.randint(45,55)
            }
        }
    }}

async def query_endstops_status():
    return {'result': {
        "x": "TRIGGERED",
        "y": "open",
        "z": "open"
    }}

async def gcode_script(script: str):
    return {'result': 'ok'}

async def gcode_help():
    return {'result': {
        "RESTART": "Reload config file and restart host software",
        "FIRMWARE_RESTART": "Restart firmware, host, and reload config",
        "STATUS": "Report the printer status",
        "HELP": "Report the list of available extended G-Code commands",
        "SAVE_CONFIG": "Overwrite config file and restart",
        "SHUTDOWN_MACHINE": "G-Code macro",
        "SET_GCODE_VARIABLE": "Set the value of a G-Code macro variable",
        "REBOOT_MACHINE": "G-Code macro",
        "UPDATE_DELAYED_GCODE": "Update the duration of a delayed_gcode",
        "TURN_OFF_HEATERS": "Turn off all heaters",
        "TEMPERATURE_WAIT": "Wait for a temperature on a sensor",
        "QUERY_ADC": "Report the last value of an analog pin",
        "QUERY_FILAMENT_SENSOR": "Query the status of the Filament Sensor",
        "SET_FILAMENT_SENSOR": "Sets the filament sensor on/off",
        "SET_PIN": "Set the value of an output pin",
        "BED_MESH_CALIBRATE": "Perform Mesh Bed Leveling",
        "BED_MESH_PROFILE": "Bed Mesh Persistent Storage management",
        "BED_MESH_OUTPUT": "Retrieve interpolated grid of probed z-points",
        "BED_MESH_MAP": "Serialize mesh and output to terminal",
        "BED_MESH_CLEAR": "Clear the Mesh so no z-adjustment is made",
        "BED_MESH_OFFSET": "Add X/Y offsets to the mesh lookup",
        "SET_GCODE_OFFSET": "Set a virtual offset to g-code positions",
        "SAVE_GCODE_STATE": "Save G-Code coordinate state",
        "RESTORE_GCODE_STATE": "Restore a previously saved G-Code state",
        "GET_POSITION": "Return information on the current location of the toolhead",
        "EXCLUDE_OBJECT_START": "Marks the beginning the current object as labeled",
        "EXCLUDE_OBJECT_END": "Marks the end the current object",
        "EXCLUDE_OBJECT": "Cancel moves inside a specified objects",
        "EXCLUDE_OBJECT_DEFINE": "Provides a summary of an object",
        "TURN_OFF_MOTORS": "G-Code macro",
        "CLEAR_PAUSE": "Clears the current paused state without resuming the print",
        "SET_PRINT_STATS_INFO": "Pass slicer info like layer act and total to klipper",
        "SDCARD_RESET_FILE": "Clears a loaded SD File. Stops the print if necessary",
        "SDCARD_PRINT_FILE": "Loads a SD file and starts the print.  May include files in subdirectories.",
        "RESPOND": "Echo the message prepended with a prefix",
        "PROBE": "Probe Z-height at current XY position",
        "QUERY_PROBE": "Return the status of the z-probe",
        "PROBE_CALIBRATE": "Calibrate the probe's z_offset",
        "PROBE_ACCURACY": "Probe Z-height accuracy at current XY position",
        "Z_OFFSET_APPLY_PROBE": "Adjust the probe's z_offset",
        "GET_CURRENT_SKEW": "Report current printer skew",
        "CALC_MEASURED_SKEW": "Calculate skew from measured print",
        "SET_SKEW": "Set skew based on lengths of measured object",
        "SKEW_PROFILE": "Profile management for skew_correction",
        "SET_STEPPER_ENABLE": "Enable/disable individual stepper by name",
        "SET_TMC_FIELD": "Set a register field of a TMC driver",
        "INIT_TMC": "Initialize TMC stepper driver registers",
        "SET_TMC_CURRENT": "Set the current of a TMC driver",
        "DUMP_TMC": "Read and display TMC stepper driver registers",
        "PID_CALIBRATE": "Run PID calibration test",
        "SET_HEATER_TEMPERATURE": "Sets a heater temperature",
        "SET_DISPLAY_TEXT": "Set or clear the display message",
        "SET_DISPLAY_GROUP": "Set the active display group",
        "STEPPER_BUZZ": "Oscillate a given stepper to help id it",
        "FORCE_MOVE": "Manually move a stepper; invalidates kinematics",
        "SET_KINEMATIC_POSITION": "Force a low-level kinematic position",
        "SET_IDLE_TIMEOUT": "Set the idle timeout in seconds",
        "QUERY_ENDSTOPS": "Report on the status of each endstop",
        "SET_VELOCITY_LIMIT": "Set printer velocity limits",
        "MANUAL_PROBE": "Start manual probe helper script",
        "TUNING_TOWER": "Tool to adjust a parameter at each Z height",
        "SET_PRESSURE_ADVANCE": "Set pressure advance parameters",
        "SET_EXTRUDER_ROTATION_DISTANCE": "Set extruder rotation distance",
        "SYNC_EXTRUDER_MOTION": "Set extruder stepper motion queue",
        "SET_EXTRUDER_STEP_DISTANCE": "Set extruder step distance",
        "SYNC_STEPPER_TO_EXTRUDER": "Set extruder stepper",
        "ACTIVATE_EXTRUDER": "Change the active extruder",
        "BASE_PAUSE": "Renamed builtin of 'PAUSE'",
        "BASE_RESUME": "Renamed builtin of 'RESUME'",
        "BASE_CANCEL_PRINT": "Renamed builtin of 'CANCEL_PRINT'",
        "ACCEPT": "Accept the current Z position",
        "ABORT": "Abort manual Z probing tool",
        "TESTZ": "Move to new Z height"
    }}

async def print_start(filename: str):
    return {'result': 'ok'}

async def print_pause():
    return {'result': 'ok'}

async def print_resume():
    return {'result': 'ok'}

async def print_cancel():
    return {'result': 'ok'}

# ------ TEST CODE ------

async def TEST():
    # Пример получения статуса
    status = await info()
    print('Printer info:', status)

if __name__ == '__main__':
    asyncio.run(TEST())