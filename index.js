const { execSync } = require('child_process');
const { extract } = require('tar');
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');
const uniqueString = require('unique-string');
const tempDir = require('temp-dir');

const getPath = () => join(tempDir, uniqueString());

function tempDirectory() {
    const directory = getPath();
    mkdirSync(directory);
    return directory;
}

/**
 * 
 * @param {string} originPackageIdentifier The full identifier of the package (name and version)
 * @param {string} targetVersion The version to re-publish to
 * @param {string[]} publishArgs Any additional arguments to pass to npm publish
 * @param {string=} registry The registry to publish to/from
 */
function republishPackage(originPackageIdentifier, targetVersion, publishArgs, registry) {
    const tempDir = tempDirectory();

    return Promise.resolve()
        .then(() => {
            const tarFile = execSync(`npm pack ${originPackageIdentifier} ${registry ? `--registry=${registry}` : ''}`, {
                cwd: tempDir
            });

            return extract({
                file: join(tempDir, tarFile.toString().trim()),
                cwd: tempDir
            });
        })
        .then(() => {
            console.log('Finished downloading and extracting the origin package.');
            const packageJson = JSON.parse(readFileSync(join(tempDir, 'package/package.json'), 'utf8'));
            packageJson.version = targetVersion;
            packageJson.uniqeBuildIdentifier = uniqueString();
            console.log('Unique identifier for this publish', packageJson.uniqeBuildIdentifier);
            writeFileSync(join(tempDir, 'package/package.json'), JSON.stringify(packageJson));
            console.log(`Wrote the target version ${targetVersion} to the package.json`);

            execSync(`npm publish --ddd --ignore-scripts ${publishArgs.join(' ')}`, {
                cwd: join(tempDir, 'package'),
                stdio: 'inherit'
            });

            console.log('Publish to target version succeeded.');
        });
}

module.exports = {
    republishPackage
}
