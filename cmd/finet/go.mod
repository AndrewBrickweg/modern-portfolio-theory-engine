module github.com/AndrewBrickweg/Finet_v2/cmd/finet

go 1.24.0

require (
	github.com/AndrewBrickweg/Finet_v2/cmd/stock v0.0.0-00010101000000-000000000000
	github.com/AndrewBrickweg/Finet_v2/database v0.0.0-20250930190400-a106d3ee87fa
	github.com/google/uuid v1.6.0
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/go-sql-driver/mysql v1.9.3 // indirect
	golang.org/x/crypto v0.42.0 // indirect
	gonum.org/v1/gonum v0.16.0 // indirect
)

replace github.com/AndrewBrickweg/Finet_v2/cmd/stock => ../stock

replace github.com/AndrewBrickweg/Finet_v2/database => ../../database
