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
const fs = require('fs');
const path = require('path');
const util = require('util');
const https = require('https');
const core = require("azure-pipelines-task-lib/task");
const exec = util.promisify(require('child_process').exec);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const DOWNLOAD_URL = "https://triangulum-cli.s3.ap-south-1.amazonaws.com/v1.4.3/linux/triangulum";
            // inputs defined in action metadata file(action.yml)
            const fileUrl = core.getInput('download_url') || DOWNLOAD_URL;
            console.log(`Triangulum CLI download URL: ${fileUrl}`);
            // Get git clone dir
            const gitCloneDir = process.env.BUILD_REPOSITORY_LOCALPATH || "";
            if (!process.env.BUILD_REPOSITORY_LOCALPATH) {
                throw new Error("Requires a BUILD_REPOSITORY_LOCALPATH environment variable");
            }
            const configPath = path.join(gitCloneDir, '.triangulum');
            // Download Triangulum CLI from given URL & give it permissions to execute
            const triangulumPath = path.join(gitCloneDir, 'triangulum');
            yield https.get(fileUrl, (res) => {
                const filePath = fs.createWriteStream(triangulumPath);
                res.pipe(filePath);
                filePath.on('finish', () => {
                    filePath.close();
                    console.log('Triangulum CLI Download Completed');
                });
            });
            console.log("Triangulum File Path", triangulumPath);
            var cmd = util.format('chmod +x %s', triangulumPath);
            const { chmod_stdout, chmod_stderr } = yield exec(cmd);
            console.log('stdout: ', chmod_stdout);
            console.error('stderr: ', chmod_stderr);
            // Add optional send to strobes flag, if enabled will send found
            // vulnerabilities to strobes
            cmd = util.format('%s --cli --cfg %s', triangulumPath, configPath);
            // Run triangulum CLI Scan
            const { cli_stdout, cli_stderr } = yield exec(cmd);
            console.log('stdout: ', cli_stdout);
            console.error('stderr: ', cli_stderr);
        }
        catch (error) {
            core.setResult(core.TaskResult.Failed, error.message);
        }
    });
}
run();
