import url = require('url');
import path = require('path');
const exec = require('child_process').exec;
import core = require('azure-pipelines-task-lib/task');



async function run() {
    try {
        // inputs defined in action metadata file(action.yml)
        const fileUrl: string = core.getInput('download_url') || "";
        const sendToStrobes: string = core.getInput('send_to_strobes') || "";
        console.log(`Triangulum CLI download URL: ${fileUrl}`)

        // Get git clone dir
        const gitCloneDir: string = process.env.BUILD_REPOSITORY_LOCALPATH || "";
        if (!process.env.BUILD_REPOSITORY_LOCALPATH) {
            throw new Error(
                "Requires a BUILD_REPOSITORY_LOCALPATH environment variable"
            )
        }
        const configPath = path.join(gitCloneDir, '.triangulum')

        // Download Triangulum CLI from given URL & give it permissions to execute
        await exec('curl', ['-O', fileUrl]);
        var fileName = url.parse(fileUrl).pathname || "";
        var fileName = fileName.split('/').pop() || "";
        const triangulumPath = path.join(gitCloneDir, fileName);
        console.log("Triangulum File Path", triangulumPath)
        await exec('chmod', ['+x', triangulumPath]);

        // Add optional send to strobes flag, if enabled will send found
        // vulnerabilities to strobes
        var args = ['--cli', '--cfg', configPath]
        if (sendToStrobes === 'true' || 'True' || 'T' || 't') {
            args.push('--sendtostrobes')
        }

        // Run triangulum CLI Scan
        await exec(triangulumPath, args);

    } catch (error: any) {
        core.setResult(core.TaskResult.Failed, error.message);
    }
}


run();