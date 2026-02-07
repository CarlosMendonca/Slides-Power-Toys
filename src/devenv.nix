{ pkgs, ... }:

{
  # Just add it to the list like any other system tool
  packages = [
    pkgs.google-clasp
  ];

  enterShell = ''
    echo "🛠️ Google Clasp environment loaded."
    clasp --version
  '';
}