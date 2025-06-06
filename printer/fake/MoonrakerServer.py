import MoonrakerWebsocketBridge as Bridge

import asyncio

async def info():
    return {'result': {
        "klippy_connected": True,
        "klippy_state": "ready",
        "components": [
            "database",
            "file_manager",
            "klippy_apis",
            "machine",
            "data_store",
            "shell_command",
            "proc_stats",
            "history",
            "octoprint_compat",
            "update_manager",
            "power"
        ],
        "failed_components": [],
        "registered_directories": ["config", "gcodes", "config_examples", "docs"],
        "warnings": [
            "Invalid config option 'api_key_path' detected in section [authorization]. Remove the option to resolve this issue. In the future this will result in a startup error.",
            "Unparsed config section [fake_section] detected.  This may be the result of a component that failed to load.  In the future this will result in a startup error."
        ],
        "websocket_count": 2,
        "moonraker_version": "v0.7.1-105-ge4f103c",
        "api_version": [1, 4, 0],
        "api_version_string": "1.4.0"
    }}

async def config():
    return {'result': {
        "config": {
            "server": {
                "host": "0.0.0.0",
                "port": 7125,
                "ssl_port": 7130,
                "enable_debug_logging": True,
                "enable_asyncio_debug": False,
                "klippy_uds_address": "/tmp/klippy_uds",
                "max_upload_size": 210,
                "ssl_certificate_path": None,
                "ssl_key_path": None
            },
            "dbus_manager": {},
            "database": {
                "database_path": "~/.moonraker_database",
                "enable_database_debug": False
            },
            "file_manager": {
                "enable_object_processing": True,
                "queue_gcode_uploads": True,
                "config_path": "~/printer_config",
                "log_path": "~/logs"
            },
            "klippy_apis": {},
            "machine": {
                "provider": "systemd_dbus"
            },
            "shell_command": {},
            "data_store": {
                "temperature_store_size": 1200,
                "gcode_store_size": 1000
            },
            "proc_stats": {},
            "job_state": {},
            "job_queue": {
                "load_on_startup": True,
                "automatic_transition": False,
                "job_transition_delay": 2,
                "job_transition_gcode": "\nM118 Transitioning to next job..."
            },
            "http_client": {},
            "announcements": {
                "dev_mode": False,
                "subscriptions": []
            },
            "authorization": {
                "login_timeout": 90,
                "force_logins": False,
                "cors_domains": [
                    "*.home",
                    "http://my.mainsail.xyz",
                    "http://app.fluidd.xyz",
                    "*://localhost:*"
                ],
                "trusted_clients": [
                    "192.168.1.0/24"
                ]
            },
            "zeroconf": {},
            "octoprint_compat": {
                "enable_ufp": True,
                "flip_h": False,
                "flip_v": False,
                "rotate_90": False,
                "stream_url": "/webcam/?action=stream",
                "webcam_enabled": True
            },
            "history": {},
            "secrets": {
                "secrets_path": "~/moonraker_secrets.ini"
            },
            "mqtt": {
                "address": "eric-work.home",
                "port": 1883,
                "username": "{secrets.mqtt_credentials.username}",
                "password_file": None,
                "password": "{secrets.mqtt_credentials.password}",
                "mqtt_protocol": "v3.1.1",
                "instance_name": "pi-debugger",
                "default_qos": 0,
                "status_objects": {
                    "webhooks": None,
                    "toolhead": "position,print_time",
                    "idle_timeout": "state",
                    "gcode_macro M118": None
                },
                "api_qos": 0,
                "enable_moonraker_api": True
            },
            "template": {}
        },
        "orig": {
            "DEFAULT": {},
            "server": {
                "enable_debug_logging": "True",
                "max_upload_size": "210"
            },
            "file_manager": {
                "config_path": "~/printer_config",
                "log_path": "~/logs",
                "queue_gcode_uploads": "True",
                "enable_object_processing": "True"
            },
            "machine": {
                "provider": "systemd_dbus"
            },
            "announcements": {},
            "job_queue": {
                "job_transition_delay": "2.",
                "job_transition_gcode": "\nM118 Transitioning to next job...",
                "load_on_startup": "True"
            },
            "authorization": {
                "trusted_clients": "\n192.168.1.0/24",
                "cors_domains": "\n*.home\nhttp://my.mainsail.xyz\nhttp://app.fluidd.xyz\n*://localhost:*"
            },
            "zeroconf": {},
            "octoprint_compat": {},
            "history": {},
            "secrets": {
                "secrets_path": "~/moonraker_secrets.ini"
            },
            "mqtt": {
                "address": "eric-work.home",
                "port": "1883",
                "username": "{secrets.mqtt_credentials.username}",
                "password": "{secrets.mqtt_credentials.password}",
                "enable_moonraker_api": "True",
                "status_objects": "\nwebhooks\ntoolhead=position,print_time\nidle_timeout=state\ngcode_macro M118"
            }
        },
        "files": [
            {
                "filename": "moonraker.conf",
                "sections": [
                    "server",
                    "file_manager",
                    "machine",
                    "announcements",
                    "job_queue",
                    "authorization",
                    "zeroconf",
                    "octoprint_compat",
                    "history",
                    "secrets"
                ]
            },
            {
                "filename": "include/extras.conf",
                "sections": [
                    "mqtt"
                ]
            }
        ]
    }}

async def temperature_store(include_monitors: bool):
    return {'result': {
        "extruder": {
            "temperatures": [21.05, 21.12, 21.1, 21.1, 21.1],
            "targets": [0, 0, 0, 0, 0],
            "powers": [0, 0, 0, 0, 0]
        },
        "temperature_fan my_fan": {
            "temperatures": [21.05, 21.12, 21.1, 21.1, 21.1],
            "targets": [0, 0, 0, 0, 0],
            "speeds": [0, 0, 0, 0, 0]
        },
        "temperature_sensor my_sensor": {
            "temperatures": [21.05, 21.12, 21.1, 21.1, 21.1]
        }
    }}

async def gcode_store(count: int):
    response = await Bridge.moonraker_request(
        "server.gcode_store",
        {"count": count}
    )
    return response

async def restart():
    response = await Bridge.moonraker_request(
        "server.restart"
    )
    return {'result': 'ok'}

# ------ TEST CODE ------

async def TEST():
    # Пример получения статуса
    status = await info()
    print("Server info:", status)

if __name__ == "__main__":
    asyncio.run(TEST())