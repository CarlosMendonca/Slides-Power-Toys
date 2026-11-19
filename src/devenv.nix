{ pkgs, ... }:

{
  # Just add it to the list like any other system tool
  packages = [
    pkgs.google-clasp
    pkgs.nodejs
  ];

  enterShell = ''
    echo "🛠️ Google Clasp & Node environment loaded."
    clasp --version
    node --version
  '';
}