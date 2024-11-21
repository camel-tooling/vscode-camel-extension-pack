/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import { ExTester, ReleaseQuality } from 'vscode-extension-tester';

export const storageFolder = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : `${os.tmpdir()}/test-resources`;;
export const extensionsFolder = path.join(storageFolder, 'test-extensions');
export const projectPath = path.resolve(__dirname, '..');
export const releaseType: ReleaseQuality = process.env.CODE_TYPE === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;

async function main(): Promise<void> {
	const tester = new ExTester(storageFolder, releaseType, extensionsFolder);
	await tester.setupAndRunTests(
		[
			'out/tests/*.test.js'
		],
		process.env.CODE_VERSION,
		{
			'installDependencies': true
		},
		{
			'cleanup': true,
			'settings': './src/ui-test/vscode-settings.json',
			resources: []
		}
	);
	fs.rmSync(extensionsFolder, { recursive: true });

	// Camel K extension is spawning tmp folder for camelk-k-client for each run of ui tests on local (because of Camel K extension installation using extension pack)
	// this will ensure that the local environment will be kept clean
	const camelkTmp = glob.globSync(path.join(projectPath, 'camelk-downloadandextract*'));
	for (const tmp of camelkTmp) {
		fs.rmSync(tmp, { recursive: true });
	}
}

main().catch((error) => {
	throw Error(`Unhandled promise rejection in main: ${error}`);
});