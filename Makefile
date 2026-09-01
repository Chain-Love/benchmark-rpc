DOCKER_REPO=chainlove/benchmark-rpc

docker:
	$(eval GIT_SHA := $(shell git rev-parse --short HEAD))
	docker build \
		-t $(DOCKER_REPO):$(GIT_SHA) \
		-t $(DOCKER_REPO):latest \
		.
	docker push $(DOCKER_REPO):$(GIT_SHA)
	docker push $(DOCKER_REPO):latest

run:
	docker run --rm \
		-p 3000:3000 \
		-e BENCHMARK_INTERVAL_MS=10000 \
		-e BENCHMARK_SAMPLES_MIN=2 \
		-e BENCHMARK_SAMPLES_MAX=10 \
		$(DOCKER_REPO):latest
