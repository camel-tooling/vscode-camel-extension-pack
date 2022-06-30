# How to release

- Check that someone listed as _submitter_ in Jenkinsfile is available
- Create a tag and push it
- Start build [on Jenkins CI](https://studio-jenkins-csb-codeready.apps.ocp-c1.prod.psi.redhat.com/job/Fuse/job/VSCode/job/vscode-camel-lsp-extension-pack-release/) with _publishToMarketPlace_ parameter checked
- Wait the build is waiting on step _Publish to Marketplace_
- The vsix is downloadable and can be tested a last time before publishing it to public
- Ensure you are logged in
- Go to the console log of the build and click "Proceed"
- Wait few minutes and check that it has been published on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=redhat.apache-camel-extension-pack)
- Keep build forever for later reference and edit build information to indicate the version
- Update package.json and Changelog.md with next version to prepare for new iteration release (via a Pull Request)
