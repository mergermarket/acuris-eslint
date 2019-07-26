// vim: filetype=groovy
// variables
def version
@Library(value='jenkins-shared-library', changelog=false) _
pipeline {
    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
    }
    agent {
        kubernetes {
            label shared.getNodeLabel(env.JOB_NAME)
            yaml shared.getPodTemplate(env.JOB_NAME)
        }
    }
    environment {
        NPM_LOGIN = credentials('npm-access')
        NPM_USER = "${env.NPM_LOGIN_USR}"
        NPM_TOKEN = "${env.NPM_LOGIN_PSW}"
    }
    stages {
        stage ("Test") {
            steps {
                container('cdflow') {
                    sh """
                    docker run -v ${PWD}:/usr/src/app -w /usr/src/app node npm install \&\& npm test
                    """
                }
            }
        }
        stage ("Deploy") {
            when { branch 'master '}
            steps {
                container('cdflow') {
                    sh """
                    docker run -v ${PWD}:/usr/src/app -w /usr/src/app node npm publish --access public
                    """
                }
            }
        }
    }
}