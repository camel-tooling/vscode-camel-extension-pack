#!/usr/bin/env groovy

node('rhel7'){
	stage('Checkout repo') {
		deleteDir()
		git url: 'https://github.com/camel-tooling/vscode-camel-extension-pack/'
	}

	stage('Install requirements') {
		def nodeHome = tool 'nodejs-8.11.1'
		env.PATH="${env.PATH}:${nodeHome}/bin"
		sh "npm install -g typescript vsce"
	}

	stage('Build') {
		sh "npm install"
	}

	stage('Package') {
		try {
				def packageJson = readJSON file: 'package.json'
				sh "vsce package -o apache-camel-extension-pack-${packageJson.version}-${env.BUILD_NUMBER}.vsix"
			}
		finally {
			archiveArtifacts artifacts: '*.vsix'
		}
	}
	
	if(params.UPLOAD_LOCATION) {
		stage('Snapshot') {
			def filesToPush = findFiles(glob: '**.vsix')
			sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${filesToPush[0].path} ${UPLOAD_LOCATION}/snapshots/vscode-camel-extension-pack/"
			stash name:'vsix', includes:filesToPush[0].path
		}
	}
}

node('rhel7'){
	if(publishToMarketPlace.equals('true')){
		timeout(time:5, unit:'DAYS') {
			input message:'Approve deployment?', submitter: 'apupier'
		}

		stage("Publish to Marketplace") {
            unstash 'vsix'
            withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
                def vsix = findFiles(glob: '**.vsix')
                sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
            }
            archive includes:"**.vsix"

            stage "Promote the build to stable"
            def vsix = findFiles(glob: '**.vsix')
            sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${vsix[0].path} ${UPLOAD_LOCATION}/stable/vscode-camel-extension-pack/"
        }
	}
}
