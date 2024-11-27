nix
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11";

  # Use https://search.nixos.org/packages to find packages
  # packages = [ ];

  # Sets environment variables in the workspace
  env = {};

devShell = pkgs.mkShell {
  buildInputs = [
    pkgs.bun
  ];
  shellHook = ''
    echo "Setting up the development environment..."
    bun install --frozen-lockfile
  '';
}
}
