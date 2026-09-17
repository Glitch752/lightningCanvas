# fix lucide imports by splitting them
find src -name '*.svelte' -exec perl -i -pe '
if (/import\s*\{([^}]*)\}\s*from\s*["'\'']\@lucide\/svelte["'\'']/) {
    my $imports = $1;
    my @names = split /\s*,\s*/, $imports;
    $_ = join("\n", map {
        my $name = $_;
        $name =~ s/^\s+|\s+$//g;
        (my $icon = $name) =~ s/([a-z])([A-Z])/$1-$2/g;
        $icon = lc $icon;
        "\timport $name from \"\@lucide/svelte/icons/$icon\";"
    } @names) . "\n";
}
' {} +