const {Compiler} = require('webpack');
const {execSync} = require('child_process');

class BuildHelperPlugin {
    constructor() {
        this.pluginName = 'BuildHelperPlugin';
    }

    apply(compiler) {
        const modifiedFiles = getModifiedFiles();

        compiler.plugin('emit', (compilation, callback) => {
            const assetsToBuild = new Set(modifiedFiles);

            compilation.modules.forEach((module) => {
                // 변경된 파일의 종속성을 찾습니다.
                if (module.resource && modifiedFiles.includes(module.resource)) {
                    module.dependencies.forEach((dependency) => {
                        if (dependency.module && dependency.module.resource) {
                            assetsToBuild.add(dependency.module.resource);
                        }
                    });
                }
            });

            // 변경된 파일과 그 종속성만 빌드하도록 웹팩 빌드를 조절합니다.
            compilation.assets = Object.keys(compilation.assets)
                .filter((asset) => assetsToBuild.has(asset))
                .reduce((acc, file) => {
                    acc[file] = compilation.assets[file];
                    return acc;
                }, {});
            callback();
        });
    }
}

function getModifiedFiles() {
    const output = execSync('git diff --name-only HEAD').toString();
    return output.trim().split('\n');
}

module.exports = BuildHelperPlugin;