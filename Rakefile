task :default => [:build, :run]

task :build do
  `cd particles && zip -r ../particles.nw .`
end

task :run do
  `open particles.nw`
end
