fn main() {
    let root_dir = std::path::Path::new(".");
    let nominalscript_dir = root_dir.join("nominalscript").join("src");

    let mut config = cc::Build::new();
    config.include(&nominalscript_dir);
    config
        .flag_if_supported("-Wno-unused-parameter")
        .flag_if_supported("-Wno-unused-but-set-variable");

    for path in &[
        nominalscript_dir.join("parser.c"),
        nominalscript_dir.join("scanner.c"),
    ] {
        config.file(&path);
        println!("cargo:rerun-if-changed={}", path.to_str().unwrap());
    }

    println!(
        "cargo:rerun-if-changed={}",
        root_dir.join("common").join("scanner.h").to_str().unwrap()
    );

    config.compile("parser-scanner");
}
