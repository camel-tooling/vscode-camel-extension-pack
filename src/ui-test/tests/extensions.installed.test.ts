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
import { expect } from 'chai';
import * as fs from 'fs';
import {
    after,
    EditorView,
    error,
    ExtensionsViewItem,
    Marketplace,
    repeat
} from 'vscode-uitests-tooling';
import { openExtensionPage } from '../utils'

describe('Extensions installed', function () {
    this.timeout(60000);
    this.slow(10000);
    const extensionMetadata: { [key: string]: any } = JSON.parse(fs.readFileSync('package.json', {
        encoding: 'utf-8'
    }));
    let marketplace: Marketplace;
    let item: ExtensionsViewItem;

    extensionMetadata['extensionPackTitles'].forEach((extensionId: string) => {

        before(async () => {
            [marketplace, item] = await openExtensionPage(extensionId, this.timeout());
        });

        after(async () => {
            this.timeout(5000);
            await marketplace.close();
            await new EditorView().closeAllEditors();
        });

        it(`'${extensionId}' is installed`, async function () {
            const testState = await repeat(async () => {
                try {
                    return await item.isInstalled();
                } catch (e) {
                    if (e instanceof error.StaleElementReferenceError) {
                        [marketplace, item] = await openExtensionPage(extensionId, this.timeout());
                        return undefined;
                    }
                    throw e;
                }
            }, {
                timeout: this.timeout(),
                message: 'Page was not rendered well'
            });
            expect(testState).to.be.true;
        });
    });
});
