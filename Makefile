DOCKER_REPO=chainlove/benchmark-rpc

docker:
	$(eval GIT_SHA := $(shell git rev-parse --short HEAD))
	docker build \
		-t $(DOCKER_REPO):$(GIT_SHA) \
		-t $(DOCKER_REPO):latest \
		.
	docker push $(DOCKER_REPO):$(GIT_SHA)
	docker push $(DOCKER_REPO):latest
