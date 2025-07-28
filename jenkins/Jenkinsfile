pipeline {
    agent any

    environment {
        DOCKER_TAG = "v1.${BUILD_NUMBER}"
    }

    stages {
        stage('build') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', passwordVariable: 'password', usernameVariable: 'username')]) {
                    sh 'docker build -t ${username}/ipcidrcalculator:1 .'
                    sh "docker tag ${username}/ipcidrcalculator:1 ${username}/ipcidrcalculator:${DOCKER_TAG}"
                }
            }
        }

        stage('push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', passwordVariable: 'password', usernameVariable: 'username')]) {
                    sh 'echo ${password} | docker login -u ${username} --password-stdin'
                    sh "docker push ${username}/ipcidrcalculator:${DOCKER_TAG}"
                }
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