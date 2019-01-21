import pyrebase
import json

config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}
firebase = pyrebase.initialize_app(config)


def get_firebase_ref(path):
    """Obtains reference to firebase database path"""
    return firebase.database().child(path)


def backup():
    """Backs up the database in JSON format"""
    with open('backup.json', 'w') as s:
        json.dump(get_firebase_ref('/').get().val(), s)
    return

backup()
