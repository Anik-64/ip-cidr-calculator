pipeline {
    agent any

    environment {
        DOCKER_TAG = "v1.${BUILD_NUMBER}"
    }

    stages {
        stage('build') {
            steps {
                sh 'docker build -t beekeeper27/ipcidrcalculator:1 .'
                sh "docker tag beekeeper27/ipcidrcalculator:1 beekeeper27/ipcidrcalculator:${DOCKER_TAG}"
            }
        }

        stage('push') {
            steps {
                sh 'echo "dckr_pat_ge_j-D0U-n6Rp-I1OiTbjECorkM" | docker login -u beekeeper27 --password-stdin'
                sh 'docker push beekeeper27/ipcidrcalculator:$BUILD_NUMBER'
            }
        }

        stage('logout') {
            steps {
                sh 'docker logout'
            }
        }

        stage('finish') {
            steps {
                echo 'Successufull!!!!'
            }
        }
    }
}