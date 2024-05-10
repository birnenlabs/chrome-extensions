## Documentation

- [JSON Window Manager](window_manager/README.md)

## submodules

This repo is using submodule, use the configuration:

```shell
git config --global submodule.recurse true
```
to automatically pull dependencies.

## Developer Documentation
### git + ssh

Add your public key to https://github.com/settings/ssh.

```shell
mkdir git
cd git
git clone --recurse-submodules https://github.com/birnenlabs/chrome-extensions


cd chrome-extensions
git remote set-url origin git+ssh://git@github.com/birnenlabs/chrome-extensions
```

### eslint
#### installs eslint runtime in the repo root directory
```shell
npm install 
```

#### install firebase dependency
```shell
npm install firebase
```

#### Check for linting errors
```shell
npm run eslint
```

#### Fix all auto-fixable linting errors
```shell
npm run eslint-fix
```

#### Check types
```shell
npm run typecheck
```

### Testing

```shell
git add -A
git commit -am "Update README.md"
git push
```


### Upload to chrome store

```shell
zip -r extension.zip ./${extension_dir}
```
