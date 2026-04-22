package ports

type Initializable interface {
	Name() string
	Init() error
}
