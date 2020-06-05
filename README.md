# kap-nextcloud

KAP screen recorder plugin to upload files to Nextcloud

* Upload public or password protected shares
* When Upload is done all relevant data is copied to clipboard (share link, valid-until date, password)
* Configure lifetime of a share
* Works with Kap 3

:warning: Removed support for Kap 2 

## Share

![detail](images/detail.png "Detail")

## Development

If you want to debug setup [KAP dev environment](https://github.com/wulkano/Kap/blob/master/contributing.md) and run:

```
export ELECTRON_ENABLE_LOGGING=1
```

In your plugins directory run ([details](https://github.com/wulkano/kap/blob/master/docs/plugins.md)):

```
npm link
```

Link your package to existing KAP plugins directory

```
cd ~/Library/Application\ Support/{Kap|Kap Beta}/plugins
npm link kap-nextcloud
```

Make sure you raise the version number to make sure it does not get overwritten by the regular install process.
