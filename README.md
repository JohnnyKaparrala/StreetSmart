Currently (11/09/2019) app breaks with Cordova v8.0.0, it works with Cordova v8.1.2

## Dependencies (not listed in config.xml)
[github.com/Lock-n/cordova-plugin-googlemaps](https://github.com/Lock-n/cordova-plugin-googlemaps)
[github.com/brodybits/cordova-sqlite-ext](https://github.com/brodybits/cordova-sqlite-ext.git) (The [main version](https://github.com/xpbrew/cordova-sqlite-storage) of the plugin didn't work)

## Database files
The database files are located in this [dropbox folder](https://www.dropbox.com/sh/v5vx6bpobvzywgu/AADXnA7OXNqG1WKOa6iUF7eoa?dl=0). They're too large to be in the git repository.
After you download the corresponding version of the database, add it to the app/www/ folder, and rename it to "occurrences.db".

The current database file being used in this version is [occurrences_2019-09-27.db](https://www.dropbox.com/s/7edhqx8f1nsd7i2/occurrences_2019-09-27.db?dl=0)