import path = require('path');
import core = require('azure-pipelines-task-lib/task');


async function run() {
    try {
        // inputs defined in action metadata file(action.yml)
        const rules = core.getInput('rules');
        const fileUrl = core.getInput('download_url');
        const sendToStrobes = core.getInput('send_to_strobes')
        console.log(`Rules: ${rules}`);
        console.log(`Triangulum CLI download URL: ${fileUrl}`)

        const gitCloneDir = process.env.GITHUB_WORKSPACE
        const configPath = path.join(gitCloneDir, '.triangulum')

        // Download Triangulum CLI from given URL & give it permissions to execute
        const triangulumPath = await tc.downloadTool(fileUrl);
        await exec.exec('chmod', ['+x', triangulumPath]);

        // Add optional send to strobes flag, if enabled will send found
        // vulnerabilities to strobes
        var args = ['--cli', '--cfg', configPath, '--rules', rules]
        if (sendToStrobes === 'true' || 'True' || 'T' || 't') {
            args.push('--sendtostrobes')
        }

        // Run triangulum CLI Scan
        await exec.exec(triangulumPath, args);

    } catch (error) {
        core.setResult(core.TaskResult.Failed, error.message);
    }
}


run();