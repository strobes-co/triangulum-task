const fs = require('fs');
const path = require('path');
const util = require('util');
const https = require('https');
import core = require('azure-pipelines-task-lib/task');
const exec = util.promisify(require('child_process').exec);



async function run() {
    try {
        // inputs defined in action metadata file(action.yml)
        const fileUrl: string = core.getInput('download_url') || "";
        const sendToStrobes: string = core.getInput('send_to_strobes') || "";
        console.log(`Triangulum CLI download URL: ${fileUrl}`);

        // Get git clone dir
        const gitCloneDir: string = process.env.BUILD_REPOSITORY_LOCALPATH || "";
        if (!process.env.BUILD_REPOSITORY_LOCALPATH) {
            throw new Error(
                "Requires a BUILD_REPOSITORY_LOCALPATH environment variable"
            )
        }
        const configPath = path.join(gitCloneDir, '.triangulum');

        // Download Triangulum CLI from given URL & give it permissions to execute
        const triangulumPath = path.join(gitCloneDir, 'triangulum');
        await https.get(fileUrl, (res: any) => {
            const filePath = fs.createWriteStream(triangulumPath);
            res.pipe(filePath);
            filePath.on('finish', () => {
                filePath.close();
                console.log('Triangulum CLI Download Completed');
            })
        })
        console.log("Triangulum File Path", triangulumPath);
        var cmd = util.format('chmod +x %s', triangulumPath);
        const { chmod_stdout, chmod_stderr } = await exec(cmd);
        console.log('stdout: ', chmod_stdout);
        console.error('stderr: ', chmod_stderr);

        // Add optional send to strobes flag, if enabled will send found
        // vulnerabilities to strobes
        cmd = util.format('%s --cli --cfg %s', triangulumPath, configPath);
        if (sendToStrobes === 'true' || 'True' || 'T' || 't') {
            cmd = cmd + ' --sendtostrobes';
        }

        // Run triangulum CLI Scan
        const { cli_stdout, cli_stderr } = await exec(cmd);
        console.log('stdout: ', cli_stdout);
        console.error('stderr: ', cli_stderr);

    } catch (error: any) {
        core.setResult(core.TaskResult.Failed, error.message);
    }
}


run();
