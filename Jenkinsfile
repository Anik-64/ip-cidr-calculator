pipeline {
    agent any

    stages {
        stage('build') {
            step {
                sh 'docker build -t beekeeper27/ipcidrcalculator:1 .'
                sh 'docker tag beekeeper27/ipcidrcalculator:1 beekeeper27/ipcidrcalculator:$BUILD_NUMBER'
            }
        }

        stage('push') {
            step {
                sh 'echo "dckr_pat_pmElttIkTLk0pJCSWbJb3YUhtzw" | docker login -u beekeeper27 --password-stdin'
                sh 'docker push beekeeper27/ipcidrcalculator:$BUILD_NUMBER'
            }
        }

        stage('logout') {
            step {
                sh 'docker logout'
            }
        }

        stage('finish') {
            step {
                echo 'Successufull!'
            }
        }
    }
}