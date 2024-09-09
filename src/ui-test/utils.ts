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
import { error, ExtensionsViewItem, Marketplace, repeat } from 'vscode-uitests-tooling';

/**
 * Open the extension page.
 * @param name Display name of the extension.
 * @param timeout Timeout in ms.
 * @returns Marketplace and ExtensionViewItem object tied with the extension.
 */
export async function openExtensionPage(name: string, timeout: number): Promise<[Marketplace, ExtensionsViewItem]> {
    let marketplace: Marketplace;
    let item: ExtensionsViewItem;
    await repeat(async () => {
        try {
            marketplace = await Marketplace.open(timeout);
            item = await marketplace.findExtension(`@installed ${name}`);
            return true;
        } catch (e) {
            if (e instanceof error.StaleElementReferenceError) {
                return {
                    delay: 1000,
                    value: undefined
                };
            }
        }
    }, {
        timeout: timeout,
        message: 'Page was not rendered'
    });
    return [marketplace!, item!];
}
