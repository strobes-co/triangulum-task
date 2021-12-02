"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const path = require("path");
const exec = require('child_process').exec;
const core = require("azure-pipelines-task-lib/task");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // inputs defined in action metadata file(action.yml)
            const fileUrl = core.getInput('download_url') || "";
            const sendToStrobes = core.getInput('send_to_strobes') || "";
            console.log(`Triangulum CLI download URL: ${fileUrl}`);
            // Get git clone dir
            const gitCloneDir = process.env.BUILD_REPOSITORY_LOCALPATH || "";
            if (!process.env.BUILD_REPOSITORY_LOCALPATH) {
                throw new Error("Requires a BUILD_REPOSITORY_LOCALPATH environment variable");
            }
            const configPath = path.join(gitCloneDir, '.triangulum');
            // Download Triangulum CLI from given URL & give it permissions to execute
            yield exec('curl', ['-O', fileUrl]);
            var fileName = url.parse(fileUrl).pathname || "";
            var fileName = fileName.split('/').pop() || "";
            const triangulumPath = path.join(gitCloneDir, fileName);
            console.log("Triangulum File Path", triangulumPath);
            yield exec('chmod', ['+x', triangulumPath]);
            // Add optional send to strobes flag, if enabled will send found
            // vulnerabilities to strobes
            var args = ['--cli', '--cfg', configPath];
            if (sendToStrobes === 'true' || 'True' || 'T' || 't') {
                args.push('--sendtostrobes');
            }
            // Run triangulum CLI Scan
            yield exec(triangulumPath, args);
        }
        catch (error) {
            core.setResult(core.TaskResult.Failed, error.message);
        }
    });
}
run();
