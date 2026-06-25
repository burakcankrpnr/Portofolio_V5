pipeline {
    agent any

    environment {
        GITHUB_CREDENTIAL = credentials('github-access-token')
        GITHUB_URL = "https://${GITHUB_CREDENTIAL}@github.com/burakcankrpnr/Portofolio_V5.git"
        GITHUB_BRANCH = 'main'
    }

    stages {

        stage('0. CLEAN WORKSPACE') {
            steps {
                cleanWs()
            }
        }

        stage('1. CHECKOUT CODE') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "${GITHUB_BRANCH}"]],
                    userRemoteConfigs: [[
                        credentialsId: 'github-access-token',
                        url: "${GITHUB_URL}"
                    ]]
                ])

                sh "git checkout ${GITHUB_BRANCH}"
            }
        }

        stage('2. BUILD AND RUN DOCKER IMAGE') {
            steps {
                script {
                    sh """
                        echo '[BUILD] Building Docker image...'
                        docker-compose build --no-cache
                        docker-compose up --detach --force-recreate --remove-orphans
                        echo '[BUILD] Docker image built and running.'
                    """
                }
            }
        }

        stage('3. CLEAN WORKSPACE (After Build)') {
            steps {
                script {
                    sh """
                        docker image prune -f || true
                        echo '[CLEANUP] Post-build cleanup completed.'
                    """
                }
            }
        }
    }
}
