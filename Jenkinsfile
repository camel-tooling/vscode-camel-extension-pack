#!/usr/bin/env groovy

node('rhel8'){
	stage('Checkout repo') {
		deleteDir()
		git url: 'https://github.com/camel-tooling/vscode-camel-extension-pack.git',
		    branch: 'main'
	}

	stage('Install requirements') {
		def nodeHome = tool 'nodejs-lts-20'
		env.PATH="${env.PATH}:${nodeHome}/bin"
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
			sh "sftp -C ${UPLOAD_LOCATION}/snapshots/vscode-camel-extension-pack/ <<< \$'put -p -r ${filesToPush[0].path}'"
			stash name:'vsix', includes:filesToPush[0].path
		}
	}
}

node('rhel8'){
	if(publishToMarketPlace.equals('true')){
		timeout(time:5, unit:'DAYS') {
			input message:'Approve deployment?', submitter: 'apupier,lheinema,tsedmik,djelinek,jraez,mdinizde'
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
            sh "sftp -C ${UPLOAD_LOCATION}/stable/vscode-camel-extension-pack/ <<< \$'put -p -r ${vsix[0].path}'"
            
            sh "npm install -g ovsx"
		    withCredentials([[$class: 'StringBinding', credentialsId: 'open-vsx-access-token', variable: 'OVSX_TOKEN']]) {
			    sh 'ovsx publish -p ${OVSX_TOKEN}' + " ${vsix[0].path}"
			}
        }
	}
}
