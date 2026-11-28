class HydroModelPort:
    def run(self, input_data):
        raise NotImplementedError

    def get_provenance(self):
        raise NotImplementedError