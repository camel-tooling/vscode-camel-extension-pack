# How to release

- Check that someone listed as _submitter_ in Jenkinsfile is available
- Create a tag and push it
- Start build [on Jenkins CI](https://master-jenkins-csb-fusetools-qe.apps.ocp-c1.prod.psi.redhat.com/view/VS%20Code%20-%20release/job/vscode/job/eng/job/vscode-camel-lsp-extension-pack-release/) with _publishToMarketPlace_ parameter checked. Ensure you are logged in.
- Wait the build is waiting on step _Publish to Marketplace_
- The vsix is downloadable and can be tested a last time before publishing it to public. You can get it from the [FTP server](https://download.jboss.org/jbosstools/vscode/snapshots/). You can later install it from VSCode -> Extensions -> "..." at the top -> Install from VSIX
- Go to the console log of the build and click "Proceed"
- Keep build forever for later reference and edit build information to indicate the version. You can find this button at the top right of the build information page.
- Add a comment with the tag name for better visualization in the build lists.
- Wait few minutes and check that it has been published on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=redhat.apache-camel-extension-pack)
- Update package.json and Changelog.md with next version to prepare for new iteration release (via a Pull Request)
