package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/pkg/errors"
)

func unmarshal(r io.Reader, v any) error {
	body, err := io.ReadAll(r)
	if err != nil {
		return errors.Wrap(err, "unmarshal")
	}

	err = json.Unmarshal(body, v)
	if err != nil {
		return errors.Wrap(err, "unmarshal")
	}

	return nil
}

func getEnv(key string) string {
	env := os.Getenv(key)
	if env == "" {
		fmt.Printf("Env variable not set correctly: %s\n", key)
	}
	return env
}

func pgUrl() string {
	return getEnv("PG_URL")
}