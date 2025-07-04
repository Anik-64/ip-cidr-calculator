pipeline {
    agent any

    stages {
        stage('build') {
            step {
                sh 'docker build -t beekeeper27/ipcidrcalculator:v1.4 .'
            }
        }

        stage('push') {
            step {
                sh 'echo "dckr_pat_pmElttIkTLk0pJCSWbJb3YUhtzw" | docker login -u beekeeper27 --password-stdin'
                sh 'docker push'
            }
        }

        stage('logout') {
            step {
                sh 'docker logout'
            }
        }
    }
}