pipeline {
    agent any

    environment {
        GITHUB_CREDENTIAL = 'github-access-token'
        GITHUB_URL = "https://${GITHUB_CREDENTIAL}@github.com/burakcankrpnr/Portofolio_V5.git"
        GITHUB_BRANCH = 'main'
    }

    stages {
        stage('Configure Git') {
            steps {
                script {
                    sh 'git config --global http.sslVerify false'
                    sh 'git config --global user.name "ACCVALO DevOps"'
                    sh 'git config --global user.email "devops@sesasis.com"'
                }
            }
        }

        stage('Checkout SCM') {
            steps {
                script {
                    checkout scm
                }
            }
        }

        stage('Validate GitHub Connection') {
            steps {
                script {
                    sh "git remote -v"
                }
            }
        }

        stage('Build Docker Compose') {
            steps {
                script {
                    buildCompose()
                }
            }
        }

        stage('Deploy Docker Compose') {
            steps {
                script {
                    runCompose()
                }
            }
        }
    }
}

def buildCompose() {
    sh "docker-compose build --no-cache"
}

def runCompose() {
    sh "docker-compose up -d --force-recreate --remove-orphans --always-recreate-deps --renew-anon-volumes"
}